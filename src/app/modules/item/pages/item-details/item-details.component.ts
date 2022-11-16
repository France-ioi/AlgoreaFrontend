import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData, readyData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { Router, RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { combineLatest, EMPTY, fromEvent, merge, Observable, of, ReplaySubject, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeWith,
  shareReplay,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';
import { TaskConfig } from '../../services/item-task.service';
import { BeforeUnloadComponent } from 'src/app/shared/guards/before-unload-guard';
import { ItemContentComponent } from '../item-content/item-content.component';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { urlArrayForItemRoute } from 'src/app/shared/routing/item-route';
import { GetAnswerService } from '../../http-services/get-answer.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { isTask } from 'src/app/shared/helpers/item-type';
import { PendingChangesComponent } from '../../../../shared/guards/pending-changes-guard';
import {
  allowsViewingContent,
  canCurrentUserViewContent,
  canCurrentUserViewSolution,
} from 'src/app/shared/models/domain/item-view-permission';
import { ItemEditWrapperComponent } from '../../components/item-edit-wrapper/item-edit-wrapper.component';
import { allowsWatchingResults } from 'src/app/shared/models/domain/item-watch-permission';

const loadForbiddenAnswerError = new Error('load answer forbidden');

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy, BeforeUnloadComponent, PendingChangesComponent {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;
  @ViewChild(ItemContentComponent) itemContentComponent?: ItemContentComponent;
  @ViewChild(ItemEditWrapperComponent) itemEditWrapperComponent?: ItemEditWrapperComponent;

  itemData$ = this.itemDataSource.state$;

  showAccessCodeField$ = this.itemData$.pipe(
    mapStateData(data =>
      data.item.promptToJoinGroupByCode && !canCurrentUserViewContent(data.item) && !this.userService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  private tabs = new ReplaySubject<TaskTab[]>(1);
  tabs$ = combineLatest([ this.tabs, this.itemData$.pipe(readyData()) ]).pipe(
    map(([ tabs, data ]) => (
      canCurrentUserViewSolution(data.item, data.currentResult) ? tabs : tabs.filter(tab => tab.view !== 'solution')
    )),
    map(tabs => tabs.filter(tab => !appConfig.featureFlags.hideTaskTabs.includes(tab.view))),
    shareReplay(1),
  );
  readonly taskTabs$ = this.tabs$.pipe(map(tabs => tabs.filter(tab => tab.view !== 'progress')));
  readonly showProgressTab$ = combineLatest([ this.itemData$.pipe(readyData()), this.groupWatchingService.isWatching$, this.tabs$ ]).pipe(
    map(([ itemData, isWatching, tabs ]) =>
      (!isWatching && allowsViewingContent(itemData.item.permissions) && tabs.some(tab => tab.view === 'progress')) ||
      (isWatching && allowsWatchingResults(itemData.item.permissions))
    ),
  );
  taskView?: TaskTab['view'];

  readonly fullFrame$ = this.layoutService.fullFrame$;
  readonly watchedGroup$ = this.groupWatchingService.watchedGroup$;

  unknownError?: unknown;

  readonly formerAnswer$ = this.itemData$.pipe(
    map(state => state.data?.route.answerId),
    distinctUntilChanged(),
    switchMap(answerId => (answerId ? this.getAnswerService.get(answerId) : of(null))),
    shareReplay(1),
  );

  readonly formerAnswerError$ = this.formerAnswer$.pipe(
    switchMap(() => EMPTY), // ignore non-errors
    catchError(error => of(errorIsHTTPForbidden(error) ? loadForbiddenAnswerError : error))
  );
  readonly formerAnswerLoadForbidden$ = this.formerAnswerError$.pipe(filter(error => error === loadForbiddenAnswerError));
  readonly answerFallbackLink$ = combineLatest([ this.itemData$.pipe(readyData()), this.formerAnswerLoadForbidden$ ]).pipe(
    map(([{ route }]) => urlArrayForItemRoute({ ...route, attemptId: undefined, parentAttemptId: undefined, answerId: undefined })),
  );

  readonly taskReadOnly$ = this.groupWatchingService.isWatching$;
  readonly taskConfig$: Observable<TaskConfig> = combineLatest([
    this.formerAnswer$.pipe(catchError(() => EMPTY)), // error is handled by formerAnswerError$
    this.taskReadOnly$,
    this.itemData$.pipe(readyData()),
  ]).pipe(map(([ formerAnswer, readOnly, data ]) => ({ readOnly, formerAnswer, locale: data.item.string.languageTag })));

  // Any value emitted in skipBeforeUnload$ resumes navigation WITHOUT cancelling the save request.
  private skipBeforeUnload$ = new Subject<void>();
  private retryBeforeUnload$ = new Subject<void>();
  private beforeUnload$ = new Subject<void>();
  private saveBeforeUnload$: Observable<{ saving: boolean, error?: Error }> = merge(this.beforeUnload$, this.retryBeforeUnload$).pipe(
    switchMap(() => {
      if (!this.itemContentComponent?.itemDisplayComponent) return of({ saving: false });
      return this.itemContentComponent.itemDisplayComponent.saveAnswerAndState().pipe(
        catchError(() => of({ saving: false, error: new Error('fail') })),
      );
    }),
    takeUntil(this.skipBeforeUnload$),
    mergeWith(this.skipBeforeUnload$.pipe(map(() => ({ saving: false })))),
    shareReplay(1),
  );
  // When navigating elsewhere but the current answer is unsaved, navigation is blocked until the save is performed.
  // savingAnswer$ indicates the loading state while blocking navigation because of the save request.
  readonly savingAnswer$ = this.saveBeforeUnload$.pipe(map(({ saving }) => saving));
  readonly saveBeforeUnloadError$ = this.saveBeforeUnload$.pipe(map(({ error }) => error));

  private subscriptions = [
    this.itemDataSource.state$.pipe(
      // submission reloads the item data. Here we handle the progress tab existence only when the item loads, not when it reloads.
      distinctUntilChanged((a, b) => a.data?.route.id === b.data?.route.id),
    ).subscribe(state => {
      // reset tabs when item changes. By default do not display it unless we currently are on progress page
      if (state.isFetching) this.tabs.next(this.showTaskTab() ? [] : [{ view: 'progress', name: 'Progress' }]);
      // update tabs when item is fetched
      // Case 1: item is not a task: display the progress tab anyway
      // Case 2: item is a task: delegate tab display to item task service, start with no tabs
      if (state.isReady) this.tabs.next(isTask(state.data.item) && this.showTaskTab() ? [] : [{ view: 'progress', name: 'Progress' }]);
    }),
    fromEvent<BeforeUnloadEvent>(globalThis, 'beforeunload', { capture: true })
      .pipe(switchMap(() => this.itemContentComponent?.itemDisplayComponent?.saveAnswerAndState() ?? of(undefined)), take(1))
      .subscribe({
        error: () => { /* Errors cannot be handled before unloading page. */ },
      }),
    this.formerAnswerError$.subscribe(caught => {
      if (caught !== loadForbiddenAnswerError) this.unknownError = caught;
    }),
  ];

  editorUrl?: string;

  errorMessage = $localize`:@@unknownError:An unknown error occurred. ` +
    $localize`:@@contactUs:If the problem persists, please contact us.`;

  showItemThreadWidget = !!appConfig.forumServerUrl;

  isDirty(): boolean {
    return !!this.itemContentComponent?.isDirty() || !!this.itemEditWrapperComponent?.isDirty();
  }

  constructor(
    private userService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
    private getAnswerService: GetAnswerService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.tabs.complete();
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  patchStateWithScore(score: number): void {
    this.itemDataSource.patchItemScore(score);
  }

  setTaskTabs(tabs: TaskTab[]): void {
    this.tabs.next(tabs);
    if (tabs.every(tab => tab.view !== this.taskView)) this.taskView = tabs[0]?.view;
  }

  setTaskTabActive(tab: TaskTab): void {
    this.taskView = tab.view;
  }

  beforeUnload(): Observable<boolean> {
    this.beforeUnload$.next();
    return this.saveBeforeUnload$.pipe(
      map(({ saving, error }) => !saving && !error),
      filter(saved => saved),
      take(1),
    );
  }

  retryBeforeUnload(): void {
    this.retryBeforeUnload$.next();
  }

  skipBeforeUnload(): void {
    this.skipBeforeUnload$.next();
  }

  private showTaskTab(): boolean {
    return !this.isProgressPage() && !this.isDependenciesPage() && !this.isParametersPage();
  }

  private isProgressPage(): boolean {
    return this.router.url.includes('/progress/');
  }

  private isDependenciesPage(): boolean {
    return this.router.url.includes('/dependencies');
  }

  private isParametersPage(): boolean {
    return this.router.url.includes('/parameters');
  }

}
