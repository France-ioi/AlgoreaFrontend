
import { Component, EventEmitter, Injector, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { merge, of, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
import { isDefined, isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { isGroupInfo, isMyGroupsInfo } from 'src/app/shared/models/content/group-info';
import { isActivityInfo, isItemInfo } from 'src/app/shared/models/content/item-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { environment } from '../../../../environments/environment';
import { GroupWatchingService } from '../../services/group-watching.service';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { SearchService } from 'src/app/shared/http-services/search.service';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { appConfig } from 'src/app/shared/helpers/config';
import { readyState } from 'src/app/shared/helpers/state';
import { NgScrollbar } from 'ngx-scrollbar';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;

const minQueryLength = 3;

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent implements OnChanges {
  @ViewChild(NgScrollbar, { static: false }) scrollbarRef?: NgScrollbar;

  @Input() searchQuery = '';
  private searchQuery$ = new ReplaySubject<string>(1);
  private retrySearch$ = new Subject<void>();
  searchResultState$ = this.searchQuery$.pipe(
    debounceTime(300),
    repeatLatestWhen(this.retrySearch$),
    switchMap(q => (q && q.length >= minQueryLength ?
      this.searchService!.search(q).pipe(
        map(q => q.searchResults),
        mapToFetchState()
      ) : of(readyState(undefined)) /* return a ready state containing `undefined` when the query is too short for searching */)),
  );

  searchService = appConfig.searchApiUrl ? this.injector.get<SearchService>(SearchService) : undefined;

  private manualTabChange = new Subject<number>();
  activeTab$ = merge(
    this.manualTabChange,
    this.currentContent.content$.pipe(
      distinctUntilChanged((x,y) => x?.type === y?.type && x?.route?.id === y?.route?.id), // do not re-emit several time for a same content
      map(content => contentToTabIndex(content)),
      filter(isDefined),
    )
  ).pipe(
    startWith(0),
    distinctUntilChanged(),
    map(idx => ({ index: idx })), // using object so that Angular ngIf does not ignore the "0" index
  );

  @Output() selectElement = this.activeTab$.pipe(
    map(tab => this.navTreeServices[tab.index]),
    filter(isNotUndefined),
    switchMap(activeTreeService => activeTreeService.state$),
    readyData(),
    map(navTreeData => navTreeData.selectedElementId),
    distinctUntilChanged(),
  );
  @Output() closeSearch = new EventEmitter<void>();

  readonly navTreeServices = [ this.activityNavTreeService, this.skillNavTreeService, this.groupNavTreeService ];
  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  isWatching$ = this.groupWatchingService.isWatching$;

  skillsDisabled = environment.featureFlags.skillsDisabled;

  constructor(
    private sessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private groupWatchingService: GroupWatchingService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private injector : Injector,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.searchQuery) this.searchQuery$.next(this.searchQuery);
  }

  onSelectionChangedByIdx(e: number): void {
    this.manualTabChange.next(e);
  }

  retryError(tabIndex: number): void {
    this.navTreeServices[tabIndex]?.retry();
  }

  retrySearch(): void {
    this.retrySearch$.next();
  }

}

function contentToTabIndex(content: ContentInfo|null): number|undefined {
  if (content === null) return undefined;
  if (isGroupInfo(content) || isMyGroupsInfo(content)) return groupsTabIdx;
  if (isItemInfo(content)) {
    return isActivityInfo(content) ? activitiesTabIdx : skillsTabIdx;
  }
  return undefined;
}
