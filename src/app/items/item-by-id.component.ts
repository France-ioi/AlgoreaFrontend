import { Component, inject, OnDestroy, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { combineLatest, of, Observable } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from 'rxjs/operators';
import { FetchState, readyState } from 'src/app/utils/state';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ItemData } from './models/item-data';
import { isItemUnavailableError } from './utils/item-unavailable-error';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';
import { mapStateData } from 'src/app/utils/operators/state';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { BeforeUnloadComponent } from 'src/app/guards/before-unload-guard';
import { ItemContentComponent } from './containers/item-content/item-content.component';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { InitialAnswerDataSource } from './services/initial-answer-datasource';
import { TabService } from 'src/app/services/tab.service';
import { ItemTabs } from './item-tabs';
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
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { fromForum, isThreadInline } from '../forum/store';
import { isNotNull } from '../utils/null-undefined-predicates';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from './store';
import { ItemBreadcrumbsWithFailoverService } from './services/item-breadcrumbs-with-failover.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { LoginWallComponent } from './containers/login-wall/login-wall.component';
import { RestrictedContentComponent } from './containers/restricted-content/restricted-content.component';
import { ItemTaskFlowService, selectState } from './item-task-flow.service';
import { ItemContentSyncService } from './item-content-sync.service';

/**
 * ItemByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-item-by-id',
  templateUrl: './item-by-id.component.html',
  styleUrl: './item-by-id.component.scss',
  providers: [ InitialAnswerDataSource, ItemTabs, ItemTaskFlowService, ItemContentSyncService ],
  imports: [
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
    RouterLinkActive,
    RouterOutlet,
    AsyncPipe,
    ButtonComponent,
    LoginWallComponent,
    RestrictedContentComponent,
    ThreadComponent,
    ButtonIconComponent,
  ]
})
export class ItemByIdComponent implements OnDestroy, BeforeUnloadComponent, PendingChangesComponent {
  private store = inject(Store);
  private itemRouter = inject(ItemRouter);
  private currentContent = inject(CurrentContentService);
  private itemTabs = inject(ItemTabs);
  private taskFlow = inject(ItemTaskFlowService);
  private itemContentSync = inject(ItemContentSyncService);
  private userSessionService = inject(UserSessionService);
  private breadcrumbService = inject(ItemBreadcrumbsWithFailoverService);
  private layoutService = inject(LayoutService);
  private currentContentService = inject(CurrentContentService);
  private tabService = inject(TabService);
  private pendingChangesService = inject(PendingChangesService);

  readonly itemContentComponent = viewChild(ItemContentComponent);

  readonly fullFrameContent$ = this.itemContentSync.fullFrameContent$;
  readonly editorUrl = this.itemContentSync.editorUrl;

  /**
   * The general state, either the route error handling state, or if not routing error, the item data
   */
  state$: Observable<FetchState<ItemData>> = this.store.select(selectState).pipe(filter(isNotNull));

  showAccessCodeField$ = this.state$.pipe(
    mapStateData(data =>
      data.item.displaySettings.promptToJoinGroupByCode
        && !canCurrentUserViewContent(data.item) && !this.userSessionService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  currentTab$ = this.itemTabs.currentTab$;
  currentTaskView$ = this.itemTabs.currentTaskView$;

  readonly observedGroup$ = this.store.select(fromObservation.selectObservedGroupInfo);
  readonly isThreadInline$ = combineLatest([
    this.store.select(fromForum.selectThreadInlineContext),
    this.userSessionService.userProfile$,
  ]).pipe(
    map(([ context, userProfile ]) => isThreadInline(context, userProfile.groupId)),
    distinctUntilChanged(),
    // Emit true immediately, but delay false by 300ms so the global panel
    // doesn't flash during quick inline→inline transitions between items.
    switchMap(value => (value ? of(true) : of(false).pipe(delay(300)))),
  );
  readonly shouldDisplayTabBar$ = this.tabService.shouldDisplayTabBar$;

  readonly answerLoadingError$ = this.taskFlow.answerLoadingError$;
  readonly taskConfig$ = this.taskFlow.taskConfig$;
  readonly savingAnswer$ = this.taskFlow.savingAnswer$;

  userProfile$ = this.userSessionService.userProfile$;
  fullFrameContentDisplayed$ = this.layoutService.fullFrameContentDisplayed$;
  withLeftPaddingContentDisplayed$ = this.layoutService.withLeftPaddingContentDisplayed$;

  constructor() {
    this.taskFlow.registerSaveHandler(() =>
      this.itemContentComponent()?.itemDisplayComponent()?.saveAnswerAndState() ?? of(readyState<void>(undefined))
    );

    this.breadcrumbService.resultPathStarted$.pipe(takeUntilDestroyed()).subscribe(() => this.currentContent.forceNavMenuReload());
  }

  errorMessageContactUs = $localize`:@@contactUs:If the problem persists, please contact us.`;

  ngOnDestroy(): void {
    this.tabService.setTabs([]);
    this.currentContent.clear();
    this.layoutService.configure({ contentDisplayType: ContentDisplayType.Default });
  }

  isDirty(): boolean {
    return !!this.itemContentComponent()?.isDirty() || !!this.pendingChangesService.component?.isDirty();
  }

  protected isItemUnavailableError(error: unknown): boolean {
    return isItemUnavailableError(error);
  }

  reloadItem(): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
  }

  onScoreChange(score: number): void {
    this.currentContentService.forceNavMenuReload();
    this.store.dispatch(fromItemContent.itemByIdPageActions.patchScore({ score }));
  }

  beforeUnload(): Observable<boolean> {
    return this.taskFlow.beforeUnload();
  }

  retryBeforeUnload(): void {
    this.taskFlow.retryBeforeUnload();
  }

  skipBeforeUnload(): void {
    this.taskFlow.skipBeforeUnload();
  }

  closeThread(): void {
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }

  navigateToDefaultTab(route: RawItemRoute): void {
    this.itemRouter.navigateTo(route, { page: [], useCurrentObservation: true });
  }

  setTaskTabs(tabs: string[]): void {
    this.itemTabs.setTaskTabs(tabs);
  }

  editorUrlChanged(url: string|undefined): void {
    this.itemTabs.editTabEnabledChange(!!url);
    this.editorUrl.set(url);
  }

  disablePlatformProgressChanged(value: boolean): void {
    this.itemTabs.disablePlatformProgressChanged(value);
  }

  setTaskView(view: string, route: RawItemRoute): void {
    this.taskFlow.setTaskView(view, route);
  }

}
