import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData, readyData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { combineLatest, fromEvent, merge, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, mergeWith, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { TaskConfig } from '../../services/item-task.service';
import { BeforeUnloadComponent } from 'src/app/shared/guards/before-unload-guard';
import { ItemContentComponent } from '../item-content/item-content.component';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { urlArrayForItemRoute } from 'src/app/shared/routing/item-route';
import { GetAnswerService } from '../../http-services/get-answer.service';

const loadForbiddenAnswerError = new Error('load answer forbidden');

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy, BeforeUnloadComponent {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;
  @ViewChild(ItemContentComponent) itemContentComponent?: ItemContentComponent;

  itemData$ = this.itemDataSource.state$;

  showAccessCodeField$ = this.itemData$.pipe(
    mapStateData(data =>
      data.item.promptToJoinGroupByCode && !canCurrentUserViewItemContent(data.item) && !this.userService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  taskTabs: TaskTab[] = [];
  taskView?: TaskTab['view'];

  readonly fullFrameContent$ = this.layoutService.fullFrameContent$;
  readonly watchedGroup$ = this.userService.watchedGroup$;

  unknownError?: Error;

  readonly formerAnswer$ = this.itemData$.pipe(
    map(state => state.data?.route.answerId),
    distinctUntilChanged(),
    switchMap(answerId => (answerId ? this.getAnswerService.get(answerId) : of(null))),
    shareReplay(1),
  );

  readonly formerAnswerError$ = this.formerAnswer$.pipe(
    catchError(error => {
      if (errorIsHTTPForbidden(error)) return of(loadForbiddenAnswerError);
      return of(error instanceof Error ? error : new Error('unknown error'));
    }),
    filter((error): error is Error => error instanceof Error),
  );
  readonly formerAnswerLoadForbidden$ = this.formerAnswerError$.pipe(filter(error => error === loadForbiddenAnswerError));
  readonly answerFallbackLink$ = combineLatest([ this.itemData$.pipe(readyData()), this.formerAnswerLoadForbidden$ ]).pipe(
    map(([{ route }]) => urlArrayForItemRoute({ ...route, attemptId: undefined, parentAttemptId: undefined, answerId: undefined })),
  );

  readonly taskReadOnly$ = this.modeService.mode$.pipe(map(mode => mode === Mode.Watching));
  readonly taskConfig$: Observable<TaskConfig> = combineLatest([
    this.formerAnswer$,
    this.taskReadOnly$,
  ]).pipe(map(([ formerAnswer, readOnly ]) => ({ readOnly, formerAnswer })));

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
    this.itemDataSource.state$.subscribe(state => {
      if (state.isFetching) this.taskTabs = []; // reset task tabs when item changes.
    }),
    fromEvent<BeforeUnloadEvent>(globalThis, 'beforeunload', { capture: true })
      .pipe(switchMap(() => this.itemContentComponent?.itemDisplayComponent?.saveAnswerAndState() ?? of(undefined)), take(1))
      .subscribe(),
    this.formerAnswerError$.subscribe(caught => {
      if (caught !== loadForbiddenAnswerError) this.unknownError = caught;
    }),
  ];

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
    private modeService: ModeService,
    private getAnswerService: GetAnswerService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  patchStateWithScore(score: number): void {
    this.itemDataSource.patchItemScore(score);
  }

  setTaskTabs(taskTabs: TaskTab[]): void {
    this.taskTabs = taskTabs;
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

}
