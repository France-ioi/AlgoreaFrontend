import { Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest, of, Subscription, EMPTY, fromEvent, merge, Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  catchError,
  mergeWith,
  takeUntil,
} from 'rxjs/operators';
import { FetchState, readyState } from 'src/app/utils/state';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { breadcrumbServiceTag } from './data-access/get-breadcrumb.service';
import { ItemData } from './models/item-data';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { isATask } from 'src/app/items/models/item-type';
import { itemInfo } from 'src/app/models/content/item-info';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';
import { mapStateData, readyData } from 'src/app/utils/operators/state';
import { RawItemRoute, routeWithSelfAttempt } from 'src/app/models/routing/item-route';
import { BeforeUnloadComponent } from 'src/app/guards/before-unload-guard';
import { ItemContentComponent } from './containers/item-content/item-content.component';
import { ItemEditWrapperComponent } from './containers/item-edit-wrapper/item-edit-wrapper.component';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { TaskTab } from './containers/item-display/item-display.component';
import { TaskConfig } from './services/item-task.service';
import { APPCONFIG } from 'src/app/config';
import { canCurrentUserViewContent, AllowsViewingItemContentPipe } from 'src/app/items/models/item-view-permission';
import { InitialAnswerDataSource } from './services/initial-answer-datasource';
import { TabService } from 'src/app/services/tab.service';
import { ItemTabs } from './item-tabs';
import { AllowsWatchingItemResultsPipe } from 'src/app/items/models/item-watch-permission';
import { ItemForumComponent } from './containers/item-forum/item-forum.component';
import { ItemDependenciesComponent } from './containers/item-dependencies/item-dependencies.component';
import { ChapterUserProgressComponent } from './containers/chapter-user-progress/chapter-user-progress.component';
import { ChapterGroupProgressComponent } from './containers/chapter-group-progress/chapter-group-progress.component';
import { ItemLogViewComponent } from './containers/item-log-view/item-log-view.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemTaskEditComponent } from './containers/item-task-edit/item-task-edit.component';
import { AnswerAuthorIndicatorComponent } from './containers/answer-author-indicator/answer-author-indicator.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ThreadComponent } from 'src/app/forum/containers/thread/thread.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { LetDirective } from '@ngrx/component';
import { TabBarComponent } from 'src/app/ui-components/tab-bar/tab-bar.component';
import { ItemPermissionsComponent } from './containers/item-permissions/item-permissions.component';
import { AccessCodeViewComponent } from 'src/app/containers/access-code-view/access-code-view.component';
import { ItemHeaderComponent } from './containers/item-header/item-header.component';
import { AsyncPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromForum, isThreadInline } from '../forum/store';
import { isNotNull } from '../utils/null-undefined-predicates';
import { LocaleService } from '../services/localeService';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from './store';
import { ItemBreadcrumbsWithFailoverService } from './services/item-breadcrumbs-with-failover.service';
import { ItemExtraTimeComponent } from './containers/item-extra-time/item-extra-time.component';
import { itemRouteAsUrlCommand } from '../models/routing/item-route-serialization';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { createSelector } from '@ngrx/store';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';

const selectState = createSelector(
  fromItemContent.selectActiveContentRouteErrorHandlingState,
  fromItemContent.selectActiveContentData,
  (routeErrorHandlingState, itemData) => (routeErrorHandlingState === null ? itemData : routeErrorHandlingState)
);

/**
 * ItemByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-item-by-id',
  templateUrl: './item-by-id.component.html',
  styleUrls: [ './item-by-id.component.scss' ],
  providers: [ InitialAnswerDataSource, ItemTabs ],
  imports: [
    NgClass,
    ItemHeaderComponent,
    AccessCodeViewComponent,
    ItemPermissionsComponent,
    TabBarComponent,
    LetDirective,
    ErrorComponent,
    RouterLink,
    AnswerAuthorIndicatorComponent,
    ItemContentComponent,
    ItemTaskEditComponent,
    LoadingComponent,
    ItemLogViewComponent,
    ChapterGroupProgressComponent,
    ChapterUserProgressComponent,
    ItemDependenciesComponent,
    ItemEditWrapperComponent,
    ItemExtraTimeComponent,
    ItemForumComponent,
    RouterLinkActive,
    AsyncPipe,
    AllowsViewingItemContentPipe,
    AllowsWatchingItemResultsPipe,
    ButtonComponent,
    ThreadComponent,
    ButtonIconComponent,
  ]
})
export class ItemByIdComponent implements OnDestroy, BeforeUnloadComponent, PendingChangesComponent {
  private store = inject(Store);
  private itemRouter = inject(ItemRouter);
  private activatedRoute = inject(ActivatedRoute);
  private currentContent = inject(CurrentContentService);
  private initialAnswerDataSource = inject(InitialAnswerDataSource);
  private itemTabs = inject(ItemTabs);
  private userSessionService = inject(UserSessionService);
  private breadcrumbService = inject(ItemBreadcrumbsWithFailoverService);
  private layoutService = inject(LayoutService);
  private currentContentService = inject(CurrentContentService);
  private tabService = inject(TabService);
  private localeService = inject(LocaleService);
  private config = inject(APPCONFIG);
  private confirmationModalService = inject(ConfirmationModalService);

  @ViewChild(ItemContentComponent) itemContentComponent?: ItemContentComponent;
  @ViewChild(ItemEditWrapperComponent) itemEditWrapperComponent?: ItemEditWrapperComponent;
  @ViewChild('contentContainer') contentContainer?: ElementRef<HTMLDivElement>;

  private destroyed$ = new Subject<void>();
  private itemRoute$ = this.store.select(fromItemContent.selectActiveContentRoute).pipe(filter(isNotNull));

  private itemState$ = this.store.select(fromItemContent.selectActiveContentData).pipe(
    filter(isNotNull),
  );

  /**
   * The general state, either the route error handling state, or if not routing error, the item data
   */
  state$: Observable<FetchState<ItemData>> = this.store.select(selectState).pipe(filter(isNotNull));

  // to prevent looping indefinitely in case of bug in services (wrong path > item without path > fetch path > item with path > wrong path)
  hasRedirected = false;

  showAccessCodeField$ = this.state$.pipe(
    mapStateData(data =>
      data.item.promptToJoinGroupByCode && !canCurrentUserViewContent(data.item) && !this.userSessionService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  currentTab$ = this.itemTabs.currentTab$;
  currentTaskView$ = this.itemTabs.currentTaskView$;

  readonly fullFrameContent$ = new BehaviorSubject<boolean>(false); // feeded by task change (below) and task api (item-content comp)
  readonly observedGroup$ = this.store.select(fromObservation.selectObservedGroupInfo);
  readonly isObserving$ = this.store.select(fromObservation.selectIsObserving);
  readonly isThreadInline$ = combineLatest([
    this.store.select(fromForum.selectThreadInlineContext),
    this.userSessionService.userProfile$,
  ]).pipe(
    map(([ context, userProfile ]) => isThreadInline(context, userProfile.groupId)),
    distinctUntilChanged(),
  );
  readonly shouldDisplayTabBar$ = this.tabService.shouldDisplayTabBar$;

  readonly answerLoadingError$ = this.initialAnswerDataSource.error$.pipe(
    switchMap(answerErr => this.itemRoute$.pipe(
      map((route, idx) => (idx === 0 && answerErr !== undefined ? {
        isForbidden: errorIsHTTPForbidden(answerErr.error),
        fallbackLink: route.answer ? itemRouteAsUrlCommand({ ...route, answer: undefined }, this.config.redirects) : undefined,
      } : undefined /* reset error if we navigate */)))
    ),
  );

  readonly taskConfig$: Observable<TaskConfig|null> = this.state$.pipe(readyData()).pipe(
    map(data => ({ isTask: isATask(data.item), route: data.route })),
    distinctUntilChanged((x, y) => JSON.stringify(x.route) === JSON.stringify(y.route)),
    switchMap(({ isTask, route }) => {
      if (!isTask) return of(null); // config for non-task's is null
      const userLocale = this.localeService.currentLang?.tag;
      if (!userLocale) throw new Error('unexpected: locale not defined');
      return this.initialAnswerDataSource.answer$.pipe(
        catchError(() => EMPTY), // error is handled by initialAnswerDataSource.error$
        map(initialAnswer => ({
          readOnly: !!route.answer,
          initialAnswer,
          locale: userLocale, // should use task locale if there is a way for the user to select it
        }))
      );
    }),
  );

  // Any value emitted in skipBeforeUnload$ resumes navigation WITHOUT cancelling the save request.
  private skipBeforeUnload$ = new Subject<void>();
  private retryBeforeUnload$ = new Subject<void>();
  private beforeUnload$ = new Subject<void>();
  private saveBeforeUnload$ = merge(this.beforeUnload$, this.retryBeforeUnload$).pipe(
    switchMap(() => {
      if (!this.itemContentComponent?.itemDisplayComponent) return of(readyState<void>(undefined));
      return this.itemContentComponent.itemDisplayComponent.saveAnswerAndState();
    }),
    takeUntil(this.skipBeforeUnload$),
    mergeWith(this.skipBeforeUnload$.pipe(map(() => readyState<void>(undefined)))),
    shareReplay(1),
  );
  // When navigating elsewhere but the current answer is unsaved, navigation is blocked until the save is performed.
  // savingAnswer$ indicates the loading state while blocking navigation because of the save request.
  readonly savingAnswer$ = this.saveBeforeUnload$.pipe(map(state => state.isFetching));
  readonly saveBeforeUnloadError$ = this.saveBeforeUnload$.pipe(map(state => state.isError));

  private itemChanged$ = this.itemState$.pipe(
    distinctUntilChanged((a, b) => a.data?.route.id === b.data?.route.id),
    map(() => {}),
  );

  userProfile$ = this.userSessionService.userProfile$;
  fullFrameContentDisplayed$ = this.layoutService.fullFrameContentDisplayed$;
  withLeftPaddingContentDisplayed$ = this.layoutService.withLeftPaddingContentDisplayed$;

  private subscriptions: Subscription[] = [

    this.itemChanged$.subscribe(() => {
      this.fullFrameContent$.next(false);
      this.editorUrl = undefined;
      this.itemTabs.itemChanged();
    }),

    fromEvent<BeforeUnloadEvent>(globalThis, 'beforeunload', { capture: true })
      .pipe(switchMap(() => this.itemContentComponent?.itemDisplayComponent?.saveAnswerAndState() ?? of(undefined)), take(1))
      .subscribe({
        error: () => { /* Errors cannot be handled before unloading page. */ },
      }),

    // on datasource state change, update the current content page info
    this.itemState$.pipe(readyData<ItemData>()).subscribe(data => {
      this.currentContent.replace(itemInfo({
        route: routeWithSelfAttempt(data.route, data.currentResult?.attemptId),
        details: {
          title: data.item.string.title,
          type: data.item.type,
          permissions: data.item.permissions,
          attemptId: data.currentResult?.attemptId,
          bestScore: data.item.noScore ? undefined : (data.item.watchedGroup ? data.item.watchedGroup.averageScore : data.item.bestScore),
          currentScore: data.item.noScore ? undefined :
            (data.item.watchedGroup ? data.item.watchedGroup.averageScore : data.currentResult?.score),
          validated: data.item.noScore ? undefined :
            (data.item.watchedGroup ? data.item.watchedGroup.averageScore === 100 : data.currentResult?.validated),
        },
      }));
    }),

    this.breadcrumbService.resultPathStarted$.subscribe(() => this.currentContent.forceNavMenuReload()),

    this.store.select(fromItemContent.selectActiveContentBreadcrumbsState).subscribe(state => {
      if (state.isError) this.currentContent.clear();

      // If path is incorrect, redirect to same page without path to trigger the solve missing path at next navigation
      if (
        state.isError &&
        errorHasTag(state.error, breadcrumbServiceTag) &&
        (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))
      ) {
        if (this.hasRedirected) throw new Error('Too many redirections (unexpected)');
        this.hasRedirected = true;
        const route = state.identifier;
        if (!route) throw new Error('unexpected: the active breadcrumbs state should always have an identifier');
        const routeWithoutPath = { ...route, path: undefined };
        this.itemRouter.navigateTo(routeWithoutPath, { navExtras: { replaceUrl: true }, useCurrentObservation: true });
      }
      if (state.isReady) this.hasRedirected = false;
    }),

    combineLatest([ this.itemRoute$, this.itemState$.pipe(startWith(undefined)) ]).pipe(
      map(([ route, itemState ]) => (itemState && route.id === itemState.data?.item.id ?
        {
          route: routeWithSelfAttempt(itemState.data.route, itemState.data.currentResult?.attemptId),
          isTask: isATask(itemState.data.item),
        } :
        { route, isTask: undefined }
      ))
    ).subscribe(({ route, isTask }) => {
      this.initialAnswerDataSource.setInfo(route, isTask);
    }),

    combineLatest([ this.itemState$.pipe(readyData<ItemData>()), this.fullFrameContent$ ]).pipe(
      map(([ data, fullFrame ]) => {
        if (fullFrame) return { id: data.route.id, display: ContentDisplayType.ShowFullFrame };
        return { id: data.route.id, display: isATask(data.item) ? ContentDisplayType.Show : ContentDisplayType.Default };
      }),
      distinctUntilChanged((x, y) => x.id === y.id && x.display === y.display), // emit once per item for a same display
      map(({ display }) => display),
    ).subscribe(display => this.layoutService.configure({ contentDisplayType: display })),

    this.saveBeforeUnloadError$.pipe(
      filter(isError => isError),
      switchMap(() => this.confirmationModalService.open({
        title: $localize`Leave unsaved task`,
        message: $localize`You do not appear to be connected to the Internet, if you leave this task you may loose your progress.
          Are you sure you want to continue?`,
        acceptButtonCaption: $localize`Loose progress and leave the task`,
        acceptButtonStyleClass: 'danger',
        rejectButtonCaption: $localize`Retry`,
        rejectButtonStyleClass: 'primary',
        allowToClose: false,
      }, { maxWidth: '34rem', disableClose: true }))
    ).subscribe(confirmed => {
      if (confirmed) {
        this.skipBeforeUnload();
      } else {
        this.retryBeforeUnload();
      }
    }),
  ];

  editorUrl?: string;

  errorMessageContactUs = $localize`:@@contactUs:If the problem persists, please contact us.`;

  showItemThreadWidget = this.config.featureFlags.enableForum;

  ngOnDestroy(): void {
    this.tabService.setTabs([]);
    this.currentContent.clear();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.layoutService.configure({ contentDisplayType: ContentDisplayType.Default });
    this.skipBeforeUnload$.complete();
    this.retryBeforeUnload$.complete();
    this.beforeUnload$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }


  isDirty(): boolean {
    return !!this.itemContentComponent?.isDirty() || !!this.itemEditWrapperComponent?.isDirty();
  }


  reloadItem(): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
  }

  onScoreChange(score: number): void {
    this.currentContentService.forceNavMenuReload();
    this.store.dispatch(fromItemContent.itemByIdPageActions.patchScore({ score }));
  }

  beforeUnload(): Observable<boolean> {
    this.beforeUnload$.next();
    return this.saveBeforeUnload$.pipe(
      map(state => state.isReady),
      filter(done => done),
      take(1),
    );
  }

  retryBeforeUnload(): void {
    this.retryBeforeUnload$.next();
  }

  skipBeforeUnload(): void {
    this.skipBeforeUnload$.next();
  }

  closeThread(): void {
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }

  navigateToDefaultTab(route: RawItemRoute): void {
    this.itemRouter.navigateTo(route, { page: [], useCurrentObservation: true });
  }

  setTaskTabs(tabs: TaskTab[]): void {
    this.itemTabs.setTaskTabs(tabs);
  }

  editorUrlChanged(url: string|undefined): void {
    this.itemTabs.editTabEnabledChange(!!url);
    this.editorUrl = url;
  }

  disablePlatformProgressChanged(value: boolean): void {
    this.itemTabs.disablePlatformProgressChanged(value);
  }

  /**
   * Called when a task request an active tab change
   */
  setTaskView(view: string): void {
    this.tabService.setActiveTab(view);
  }

}
