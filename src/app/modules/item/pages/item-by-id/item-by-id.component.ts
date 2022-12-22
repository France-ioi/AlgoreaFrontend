import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, UrlTree } from '@angular/router';
import { combineLatest, of, ReplaySubject, Subscription, EMPTY, fromEvent, merge, Observable, Subject, delay } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  take,
  catchError,
  mergeWith,
  takeUntil
} from 'rxjs/operators';
import { defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { errorState, fetchingState, FetchState, isFetchingOrError } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { breadcrumbServiceTag } from '../../http-services/get-breadcrumb.service';
import { GetItemPathService } from '../../http-services/get-item-path.service';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/shared/helpers/errors';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { isTask, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { itemInfo } from 'src/app/shared/models/content/item-info';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { isItemRouteError, itemRouteFromParams } from './item-route-validation';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { mapStateData, mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { ensureDefined } from 'src/app/shared/helpers/assert';
import { routeWithSelfAttempt } from 'src/app/shared/routing/item-route';
import { BeforeUnloadComponent } from 'src/app/shared/guards/before-unload-guard';
import { ItemContentComponent } from '../item-content/item-content.component';
import { ItemEditWrapperComponent } from '../../components/item-edit-wrapper/item-edit-wrapper.component';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { TaskTab } from '../item-display/item-display.component';
import { TaskConfig } from '../../services/item-task.service';
import { urlArrayForItemRoute } from 'src/app/shared/routing/item-route';
import { GetAnswerService } from '../../http-services/get-answer.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { allowsWatchingResults } from 'src/app/shared/models/domain/item-watch-permission';
import {
  allowsViewingContent,
  canCurrentUserViewContent,
  canCurrentUserViewSolution
} from 'src/app/shared/models/domain/item-view-permission';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DiscussionService } from '../../services/discussion.service';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';

const itemBreadcrumbCat = $localize`Items`;
const loadForbiddenAnswerError = new Error('load answer forbidden');

const animationTiming = '.6s .2s ease-in-out';

/**
 * ItemByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-item-by-id',
  templateUrl: './item-by-id.component.html',
  styleUrls: [ './item-by-id.component.scss' ],
  providers: [ ItemDataSource ],
  animations: [
    trigger('threadOpenClose', [
      state('opened', style({
        marginRight: '25rem',
      })),
      state('closed', style({
        marginRight: 0,
      })),
      transition('opened => closed', [
        animate(animationTiming)
      ]),
      transition('closed => opened', [
        animate(animationTiming)
      ]),
    ]),
  ]
})
export class ItemByIdComponent implements OnDestroy, BeforeUnloadComponent, PendingChangesComponent {

  @ViewChild(ItemContentComponent) itemContentComponent?: ItemContentComponent;
  @ViewChild(ItemEditWrapperComponent) itemEditWrapperComponent?: ItemEditWrapperComponent;
  @ViewChild('contentContainer') contentContainer?: ElementRef<HTMLDivElement>;

  private itemRouteState$ = this.activatedRoute.paramMap.pipe(
    repeatLatestWhen(this.userSessionService.userChanged$),
    // When loading a task with a former answerId, we need to remove the answerId from the url to avoid reloading
    // a former answer if the user refreshes the page
    // However, replacing the url should not retrigger an item fetch either, thus the use of history.state.preventRefetch
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
    filter(() => !(typeof history.state === 'object' && history.state?.preventRefetch)),
    switchMap(params => {
      const item = this.getItemRoute(params);
      if (isItemRouteError(item)) {
        if (!item.id) throw new Error('unexpected: no id in item page');
        return this.solveMissingPathAttempt(item.contentType, item.id, item.path, item.answerId);
      }
      return of(item);
    }),
    mapToFetchState()
  );

  state$: Observable<FetchState<ItemData>> = merge(
    this.itemRouteState$.pipe(
      filter(isFetchingOrError),
      map(s => (s.isFetching ? fetchingState() : errorState(s.error)))
    ),
    this.itemDataSource.state$
  );

  // to prevent looping indefinitely in case of bug in services (wrong path > item without path > fetch path > item with path > wrong path)
  hasRedirected = false;

  showAccessCodeField$ = this.state$.pipe(
    mapStateData(data =>
      data.item.promptToJoinGroupByCode && !canCurrentUserViewContent(data.item) && !this.userSessionService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  private tabs = new ReplaySubject<TaskTab[]>(1);
  tabs$ = combineLatest([ this.tabs, this.state$.pipe(readyData()) ]).pipe(
    map(([ tabs, data ]) => (
      canCurrentUserViewSolution(data.item, data.currentResult) ? tabs : tabs.filter(tab => tab.view !== 'solution')
    )),
    map(tabs => tabs.filter(tab => !appConfig.featureFlags.hideTaskTabs.includes(tab.view))),
    shareReplay(1),
  );
  readonly taskTabs$ = this.tabs$.pipe(map(tabs => tabs.filter(tab => tab.view !== 'progress')));
  readonly showProgressTab$ = combineLatest([ this.state$.pipe(readyData()), this.groupWatchingService.isWatching$, this.tabs$ ]).pipe(
    map(([ itemData, isWatching, tabs ]) =>
      (!isWatching && allowsViewingContent(itemData.item.permissions) && tabs.some(tab => tab.view === 'progress')) ||
      (isWatching && allowsWatchingResults(itemData.item.permissions))
    ),
  );
  taskView?: TaskTab['view'];

  readonly fullFrame$ = this.layoutService.fullFrame$;
  readonly watchedGroup$ = this.groupWatchingService.watchedGroup$;

  unknownError?: unknown;

  readonly formerAnswer$ = this.state$.pipe(
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
  readonly answerFallbackLink$ = combineLatest([ this.state$.pipe(readyData()), this.formerAnswerLoadForbidden$ ]).pipe(
    map(([{ route }]) => urlArrayForItemRoute({ ...route, attemptId: undefined, parentAttemptId: undefined, answerId: undefined })),
  );

  readonly taskReadOnly$ = this.groupWatchingService.isWatching$;
  readonly taskConfig$: Observable<TaskConfig> = combineLatest([
    this.formerAnswer$.pipe(catchError(() => EMPTY)), // error is handled by formerAnswerError$
    this.taskReadOnly$,
    this.state$.pipe(readyData()),
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

  threadOpened$ = this.discussionService.state$.pipe(filter(isNotUndefined), map(({ visible }) => visible));

  contentContainerTop = 0;

  private subscriptions: Subscription[] = [
    this.itemDataSource.state$.pipe(
      // submission reloads the item data. Here we handle the progress tab existence only when the item loads, not when it reloads.
      distinctUntilChanged((a, b) => a.data?.route.id === b.data?.route.id),
    ).subscribe(state => {
      // reset tabs when item changes. By default do not display it unless we currently are on progress page
      this.editorUrl = undefined;
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

    this.itemRouteState$.subscribe(state => {
      if (state.isReady) {
        // just publish to current content the new route we are navigating to (without knowing any info)
        this.currentContent.replace(itemInfo({
          route: state.data,
          breadcrumbs: { category: itemBreadcrumbCat, path: [], currentPageIdx: -1 }
        }));
        // trigger the fetch of the item (which will itself re-update the current content)
        this.itemDataSource.fetchItem(state.data);
      } else if (state.isError) {
        this.layoutService.configure({ fullFrameActive: false });
        this.currentContent.clear();
      }
    }),

    // on datasource state change, update the current content page info
    this.itemDataSource.state$.subscribe(state => {
      if (state.isReady) {
        this.hasRedirected = false;
        this.currentContent.replace(itemInfo({
          breadcrumbs: {
            category: itemBreadcrumbCat,
            path: state.data.breadcrumbs.map(el => ({
              title: el.title,
              hintNumber: el.attemptCnt,
              navigateTo: ():UrlTree => this.itemRouter.url(el.route),
            })),
            currentPageIdx: state.data.breadcrumbs.length - 1,
          },
          title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
          route: routeWithSelfAttempt(state.data.route, state.data.currentResult?.attemptId),
          details: {
            title: state.data.item.string.title,
            type: state.data.item.type,
            permissions: state.data.item.permissions,
            attemptId: state.data.currentResult?.attemptId,
            bestScore: state.data.item.watchedGroup ? state.data.item.watchedGroup.averageScore : state.data.item.bestScore,
            currentScore: state.data.item.watchedGroup ? state.data.item.watchedGroup.averageScore : state.data.currentResult?.score,
            validated: state.data.item.watchedGroup ?
              state.data.item.watchedGroup.averageScore === 100 : state.data.currentResult?.validated,
          },
        }));

        if (state.data.route.answerId) {
          this.itemRouter.navigateTo(
            { ...state.data.route, answerId: undefined },
            { navExtras: { replaceUrl: true, state: { preventRefetch: true } } },
          );
        }

      } else if (state.isError) {
        // If path is incorrect, redirect to same page without path to trigger the solve missing path at next navigation
        if (errorHasTag(state.error, breadcrumbServiceTag) && (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))) {
          if (this.hasRedirected) throw new Error('Too many redirections (unexpected)');
          this.hasRedirected = true;
          const { contentType, id, answerId } = this.getItemRoute();
          if (!id) throw new Error('Unexpected: item id should exist');
          this.itemRouter.navigateTo({ contentType, id, answerId }, { navExtras: { replaceUrl: true } });
        }
        this.currentContent.clear();
      }
    }),

    this.itemDataSource.state$.pipe(
      readyData(),
      distinctUntilChanged((a, b) => a.item.id === b.item.id),
      startWith(undefined),
      pairwise(),
      filter(([ previous, current ]) => (!!current && (!previous || isTask(previous.item) || isTask(current.item)))),
      map(([ , current ]) => ensureDefined(current).item),
    ).subscribe(item => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
      const activateFullFrame = isTask(item) && !(typeof history.state === 'object' && history.state?.preventFullFrame);
      this.layoutService.configure({ fullFrameActive: activateFullFrame });
    }),

    merge(
      this.itemDataSource.state$.pipe(readyData()),
      this.layoutService.fullFrame$,
      this.taskTabs$,
      fromEvent(window, 'resize'),
    ).pipe(
      delay(0),
      map(() => this.contentContainer?.nativeElement.offsetTop || 0),
      distinctUntilChanged(),
    ).subscribe(contentContainerTop =>
      this.contentContainerTop = contentContainerTop
    ),
  ];

  editorUrl?: string;

  errorMessage = $localize`:@@unknownError:An unknown error occurred. ` +
    $localize`:@@contactUs:If the problem persists, please contact us.`;

  showItemThreadWidget = !!appConfig.forumServerUrl;

  constructor(
    private router: Router,
    private itemRouter: ItemRouter,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private resultActionsService: ResultActionsService,
    private getItemPathService: GetItemPathService,
    private getAnswerService: GetAnswerService,
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
    private discussionService: DiscussionService,
  ) {}

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.layoutService.fullFrame$
      .pipe(take(1), filter(fullFrame => fullFrame.active)) // if layout is in full frame and we quit an item page => disable full frame
      .subscribe(() => this.layoutService.configure({ fullFrameActive: false }));
    this.tabs.complete();
  }


  isDirty(): boolean {
    return !!this.itemContentComponent?.isDirty() || !!this.itemEditWrapperComponent?.isDirty();
  }


  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  onScoreChange(score: number): void {
    this.currentContentService.forceNavMenuReload();
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

  private getItemRoute(params?: ParamMap): ReturnType<typeof itemRouteFromParams> {
    const snapshot = this.activatedRoute.snapshot;
    if (!snapshot.parent) throw new Error('Unexpected: activated route snapshot has no parent');
    if (!snapshot.parent.url[0]) throw new Error('Unexpected: activated route snapshot parent has no url');
    return itemRouteFromParams(snapshot.parent.url[0].path, params ?? snapshot.paramMap);
  }

  /**
   * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
   * Will redirect when relevant data has been fetched (and emit nothing).
   * May emit errors.
   */
  private solveMissingPathAttempt(contentType: ItemTypeCategory, id: string, path?: string[], answerId?: string): Observable<never> {
    return of(path).pipe(
      switchMap(path => (path ? of(path) : this.getItemPathService.getItemPath(id))),
      switchMap(path => {
        // for empty path (root items), consider the item has a (fake) parent attempt id 0
        if (path.length === 0) return of({ contentType, id, path, parentAttemptId: defaultAttemptId, answerId });
        // else, will start all path but the current item
        return this.resultActionsService.startWithoutAttempt(path).pipe(
          map(attemptId => ({ contentType, id, path, parentAttemptId: attemptId, answerId }))
        );
      }),
      switchMap(itemRoute => {
        this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
        return EMPTY;
      })
    );
  }

}
