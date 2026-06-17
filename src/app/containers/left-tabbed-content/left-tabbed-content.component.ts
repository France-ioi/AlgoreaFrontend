import { Component, inject, Injector, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { isDefined } from '../../utils/null-undefined-predicates';
import { ContentInfo } from '../../models/content/content-info';
import { isGroupInfo, isMyGroupsInfo, isUserInfo } from '../../models/content/group-info';
import { isActivityInfo, isItemInfo } from '../../models/content/item-info';
import { CurrentContentService } from '../../services/current-content.service';
import { mapToFetchState } from '../../utils/operators/state';
import { SearchService } from '../../data-access/search.service';
import { repeatLatestWhen } from '../../utils/operators/repeatLatestWhen';
import { APPCONFIG, LeftMenuTabType } from '../../config';
import { readyState } from '../../utils/state';
import { Store } from '@ngrx/store';
import { ItemRouter } from '../../models/routing/item-router';
import { GroupRouter } from '../../models/routing/group-router';
import { EntityPathRoute } from '../../models/routing/entity-route';
import { fromSelectedContent } from '../../store/navigation';
import { fromCommunity } from '../../community/store';
import { LeftMenuConfigService } from '../../config/left-menu-config.service';
import { LeftTabBarComponent } from '../left-tab-bar/left-tab-bar.component';
import { LeftNavComponent } from '../left-nav/left-nav.component';
import { SELECTED_NAV_NODE_SELECTOR } from '../left-nav-tree/left-nav-tree.component';
import { LeftSearchResultComponent } from '../left-search-result/left-search-result.component';
import { LeftMenuSearchComponent } from '../../ui-components/left-menu-search/left-menu-search.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe } from '@angular/common';
import { CommunityStatsComponent } from '../../community/containers/community-stats/community-stats.component';

const minQueryLength = 3;

// Fixed tree indices for alg-left-nav; decoupled from visible tab order in leftMenuTabs.
const TREE_TAB_TYPES: LeftMenuTabType[] = [ 'activities', 'skills', 'groups' ];

@Component({
  selector: 'alg-left-tabbed-content',
  templateUrl: './left-tabbed-content.component.html',
  styleUrls: [ './left-tabbed-content.component.scss' ],
  imports: [
    LeftTabBarComponent,
    LeftNavComponent,
    LeftMenuSearchComponent,
    LeftSearchResultComponent,
    LoadingComponent,
    ErrorComponent,
    NgScrollbar,
    LetDirective,
    AsyncPipe,
    CommunityStatsComponent,
  ],
})
export class LeftTabbedContentComponent implements OnDestroy {
  private store = inject(Store);
  private currentContent = inject(CurrentContentService);
  private injector = inject(Injector);
  private itemRouter = inject(ItemRouter);
  private groupRouter = inject(GroupRouter);
  private router = inject(Router);
  private leftMenuConfig = inject(LeftMenuConfigService);
  private config = inject(APPCONFIG);

  leftNavRef = viewChild(LeftNavComponent);

  hideTree = input(false);
  searchActiveChange = output<boolean>();

  searchActive = signal(false);
  searchQuery = signal('');

  private retrySearch$ = new Subject<void>();

  searchService = this.config.searchApiUrl ? this.injector.get<SearchService>(SearchService) : undefined;

  searchResultState$ = toObservable(this.searchQuery).pipe(
    debounceTime(300),
    repeatLatestWhen(this.retrySearch$),
    switchMap(q => (q && q.length >= minQueryLength
      ? this.searchService!.search(q).pipe(map(r => r.searchResults), mapToFetchState())
      : of(readyState(undefined)))),
  );

  hasUnreadCommunityThreads$ = this.store.select(fromCommunity.selectHasUnreadThreads);

  visibleTabs$ = this.leftMenuConfig.visibleTabs$;
  showTabs$ = this.leftMenuConfig.showTabBar$;

  activeTab$ = this.currentContent.content$.pipe(
    distinctUntilChanged((x, y) => x?.type === y?.type && x?.route?.id === y?.route?.id),
    map(content => contentToTabType(content)),
    filter(isDefined),
    withLatestFrom(this.visibleTabs$),
    filter(([ tabType, visibleTabs ]) => visibleTabs.includes(tabType)),
    map(([ tabType ]) => tabType),
    startWith('activities' as LeftMenuTabType),
    distinctUntilChanged(),
  );

  selectElement = output<EntityPathRoute | undefined>();

  private selectedActivityRoute = this.store.selectSignal(fromSelectedContent.selectActivity);
  private selectedSkillRoute = this.store.selectSignal(fromSelectedContent.selectSkill);
  private selectedGroupRoute = this.store.selectSignal(fromSelectedContent.selectGroup);

  private selectedElement$ = new Subject<void>();
  private scrollSubscription = this.selectedElement$.pipe(debounceTime(250)).subscribe(() => this.scrollToContent());

  toggleSearch(): void {
    if (this.searchActive()) {
      this.closeSearch();
      return;
    }
    this.searchActive.set(true);
    this.searchActiveChange.emit(true);
  }

  closeSearch(): void {
    this.searchActive.set(false);
    this.searchQuery.set('');
    this.searchActiveChange.emit(false);
  }

  onSelectionChangedByType(tabType: LeftMenuTabType): void {
    if (this.searchActive()) {
      this.closeSearch();
    }
    if (tabType === 'activities') {
      const route = this.selectedActivityRoute();
      if (route) this.itemRouter.navigateTo(route, { useCurrentObservation: true });
    }
    if (tabType === 'skills') {
      const route = this.selectedSkillRoute();
      if (route) this.itemRouter.navigateTo(route, { useCurrentObservation: true });
    }
    if (tabType === 'groups') {
      this.groupRouter.navigateTo(this.selectedGroupRoute());
    }
    if (tabType === 'community') {
      void this.router.navigate([ '/community' ]);
    }
    if (tabType === 'search') {
      this.toggleSearch();
    }
  }

  retrySearch(): void {
    this.retrySearch$.next();
  }

  tabToTreeIndex(tabType: LeftMenuTabType): number {
    return TREE_TAB_TYPES.indexOf(tabType);
  }

  isTreeTab(tabType: LeftMenuTabType): boolean {
    return TREE_TAB_TYPES.includes(tabType);
  }

  isCommunityTab(tabType: LeftMenuTabType): boolean {
    return tabType === 'community';
  }

  onSelectElement(route: EntityPathRoute | undefined): void {
    this.selectElement.emit(route);
    if (route !== undefined) {
      this.selectedElement$.next();
    }
  }

  private scrollToContent(): void {
    const scrollbarDirectiveRef = this.leftNavRef()?.scrollbarRef();
    if (!scrollbarDirectiveRef) return;
    const scrollbarElement = scrollbarDirectiveRef.nativeElement;
    // The same item id can legitimately appear at two different paths in the tree (e.g. as a chapter sibling and as that
    // chapter's child). The selection logic guarantees a unique `data-selected="true"` node — using the stable selector
    // exported by `LeftNavTreeComponent` lets us scroll to that specific occurrence rather than to an arbitrary id match.
    const menuItemEl = scrollbarElement.querySelector<HTMLElement>(SELECTED_NAV_NODE_SELECTOR);
    if (!menuItemEl) return;

    const menuItemRect = menuItemEl.getBoundingClientRect();
    const scrollbarElementRect = scrollbarElement.getBoundingClientRect();

    // Scroll only when the selected node is not fully visible: either it overflows the bottom edge of the scrollbar
    // viewport, or its top is above the viewport top.
    const overflowsBottom = (menuItemRect.y + menuItemRect.height) >= (scrollbarElementRect.y + scrollbarElementRect.height);
    const aboveTop = (menuItemRect.y - scrollbarElementRect.y) <= 0;
    if (overflowsBottom || aboveTop) {
      void scrollbarDirectiveRef.scrollToElement(SELECTED_NAV_NODE_SELECTOR);
    }
  }

  ngOnDestroy(): void {
    this.scrollSubscription.unsubscribe();
  }
}

function contentToTabType(content: ContentInfo | null): LeftMenuTabType | undefined {
  if (content === null) return undefined;
  if (content.type === 'community') return 'community';
  if (isGroupInfo(content) || isMyGroupsInfo(content) || isUserInfo(content)) return 'groups';
  if (isItemInfo(content)) {
    return isActivityInfo(content) ? 'activities' : 'skills';
  }
  return undefined;
}
