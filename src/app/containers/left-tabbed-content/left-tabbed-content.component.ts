import {
  ChangeDetectionStrategy, Component, inject, Injector, Input, OnChanges, OnDestroy, output, SimpleChanges, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { of, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { isDefined } from '../../utils/null-undefined-predicates';
import { ContentInfo } from '../../models/content/content-info';
import { isGroupInfo, isMyGroupsInfo, isUserInfo } from '../../models/content/group-info';
import { isActivityInfo, isItemInfo } from '../../models/content/item-info';
import { CurrentContentService } from '../../services/current-content.service';
import { mapToFetchState } from '../../utils/operators/state';
import { SearchService } from '../../data-access/search.service';
import { repeatLatestWhen } from '../../utils/operators/repeatLatestWhen';
import { APPCONFIG } from '../../config';
import { readyState } from '../../utils/state';
import { Store } from '@ngrx/store';
import { ItemRouter } from '../../models/routing/item-router';
import { GroupRouter } from '../../models/routing/group-router';
import { fromSelectedContent } from '../../store/navigation';
import { LeftMenuConfigService } from '../../config/left-menu-config.service';
import { LeftTabBarComponent } from '../left-tab-bar/left-tab-bar.component';
import { LeftNavComponent } from '../left-nav/left-nav.component';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { LeftSearchResultComponent } from '../left-search-result/left-search-result.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe } from '@angular/common';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;
const communityTabIdx = 3;

const minQueryLength = 3;

@Component({
  selector: 'alg-left-tabbed-content',
  templateUrl: './left-tabbed-content.component.html',
  styleUrls: [ './left-tabbed-content.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LeftTabBarComponent,
    LeftNavComponent,
    LeftMenuBackButtonComponent,
    LeftSearchResultComponent,
    LoadingComponent,
    ErrorComponent,
    NgScrollbar,
    LetDirective,
    AsyncPipe,
  ],
})
export class LeftTabbedContentComponent implements OnChanges, OnDestroy {
  private store = inject(Store);
  private currentContent = inject(CurrentContentService);
  private injector = inject(Injector);
  private itemRouter = inject(ItemRouter);
  private groupRouter = inject(GroupRouter);
  private router = inject(Router);
  private leftMenuConfig = inject(LeftMenuConfigService);
  private config = inject(APPCONFIG);

  @ViewChild(LeftNavComponent, { static: false }) leftNavRef?: LeftNavComponent;

  @Input() searchQuery = '';
  private searchQuery$ = new ReplaySubject<string>(1);
  private retrySearch$ = new Subject<void>();

  searchService = this.config.searchApiUrl ? this.injector.get<SearchService>(SearchService) : undefined;

  searchResultState$ = this.searchQuery$.pipe(
    debounceTime(300),
    repeatLatestWhen(this.retrySearch$),
    switchMap(q => (q && q.length >= minQueryLength
      ? this.searchService!.search(q).pipe(map(r => r.searchResults), mapToFetchState())
      : of(readyState(undefined)))),
  );

  skillsTabEnabled$ = this.leftMenuConfig.skillsTabEnabled$;
  groupsTabEnabled$ = this.leftMenuConfig.groupsTabEnabled$;
  communityTabEnabled$ = this.leftMenuConfig.communityTabEnabled$;
  showTabs$ = this.leftMenuConfig.showTabBar$;

  activeTab$ = this.currentContent.content$.pipe(
    distinctUntilChanged((x, y) => x?.type === y?.type && x?.route?.id === y?.route?.id),
    map(content => contentToTabIndex(content)),
    filter(isDefined),
    withLatestFrom(this.skillsTabEnabled$, this.groupsTabEnabled$, this.communityTabEnabled$),
    filter(([ idx, skillsTabEnabled, groupsTabEnabled, communityTabEnabled ]) =>
      idx === activitiesTabIdx
      || (idx === skillsTabIdx && skillsTabEnabled)
      || (idx === groupsTabIdx && groupsTabEnabled)
      || (idx === communityTabIdx && communityTabEnabled)),
    map(([ idx ]) => idx),
    startWith(0),
    distinctUntilChanged(),
    map(idx => ({ index: idx })),
  );

  closeSearch = output();
  selectElement = output<string | undefined>();

  private selectedActivityRoute = this.store.selectSignal(fromSelectedContent.selectActivity);
  private selectedSkillRoute = this.store.selectSignal(fromSelectedContent.selectSkill);
  private selectedGroupRoute = this.store.selectSignal(fromSelectedContent.selectGroup);

  private selectedElement$ = new Subject<string>();
  private scrollSubscription = this.selectedElement$.pipe(debounceTime(250)).subscribe(id => this.scrollToContent(id));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.searchQuery) this.searchQuery$.next(this.searchQuery);
  }

  onSelectionChangedByIdx(e: number): void {
    if (e === activitiesTabIdx) {
      const route = this.selectedActivityRoute();
      if (route) this.itemRouter.navigateTo(route, { useCurrentObservation: true });
    }
    if (e === skillsTabIdx) {
      const route = this.selectedSkillRoute();
      if (route) this.itemRouter.navigateTo(route, { useCurrentObservation: true });
    }
    if (e === groupsTabIdx) {
      this.groupRouter.navigateTo(this.selectedGroupRoute());
    }
    if (e === communityTabIdx) {
      void this.router.navigate([ '/community' ]);
    }
  }

  retrySearch(): void {
    this.retrySearch$.next();
  }

  tabToTreeIndex(tabIndex: number): number {
    return tabIndex;
  }

  isTreeTab(tabIndex: number): boolean {
    return [ activitiesTabIdx, skillsTabIdx, groupsTabIdx ].includes(tabIndex);
  }

  onSelectElement(id: string | undefined): void {
    this.selectElement.emit(id);
    if (id !== undefined) {
      this.selectedElement$.next(id);
    }
  }

  private scrollToContent(id: string): void {
    const scrollbarDirectiveRef = this.leftNavRef?.scrollbarRef;
    if (!scrollbarDirectiveRef) return;
    const scrollbarElement = scrollbarDirectiveRef.nativeElement;
    const menuItemEl = scrollbarElement.querySelector<HTMLElement>(`#nav-${ id }`);
    if (!menuItemEl) return;

    const menuItemRect = menuItemEl.getBoundingClientRect();
    const scrollbarElementRect = scrollbarElement.getBoundingClientRect();

    if ((menuItemRect.y + menuItemRect.height) >= (scrollbarElementRect.y + scrollbarElementRect.height)
      || (menuItemRect.y - menuItemRect.y) <= 0) {
      void scrollbarDirectiveRef.scrollToElement(`#nav-${ id }`);
    }
  }

  ngOnDestroy(): void {
    this.scrollSubscription.unsubscribe();
  }
}

function contentToTabIndex(content: ContentInfo | null): number | undefined {
  if (content === null) return undefined;
  if (content.type === 'community') return communityTabIdx;
  if (isGroupInfo(content) || isMyGroupsInfo(content) || isUserInfo(content)) return groupsTabIdx;
  if (isItemInfo(content)) {
    return isActivityInfo(content) ? activitiesTabIdx : skillsTabIdx;
  }
  return undefined;
}
