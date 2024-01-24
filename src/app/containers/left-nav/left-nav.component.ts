
import { Component, EventEmitter, Injector, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { merge, of, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
import { isDefined, isNotUndefined } from '../../utils/null-undefined-predicates';
import { ContentInfo } from 'src/app/models/content/content-info';
import { isGroupInfo, isMyGroupsInfo } from 'src/app/models/content/group-info';
import { isActivityInfo, isItemInfo } from 'src/app/models/content/item-info';
import { CurrentContentService } from '../../services/current-content.service';
import { UserSessionService } from '../../services/user-session.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { SearchService } from '../../data-access/search.service';
import { repeatLatestWhen } from 'src/app/utils/operators/repeatLatestWhen';
import { appConfig } from 'src/app/utils/config';
import { readyState } from '../../utils/state';
import { NgScrollbar } from 'ngx-scrollbar';
import { LayoutService } from '../../services/layout.service';
import { LeftNavTreeComponent } from '../left-nav-tree/left-nav-tree.component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { LeftSearchResultComponent } from '../left-search-result/left-search-result.component';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { LetDirective } from '@ngrx/component';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { LocaleService } from '../../services/localeService';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;

const minQueryLength = 3;

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    LetDirective,
    LeftMenuBackButtonComponent,
    LoadingComponent,
    ErrorComponent,
    NgScrollbar,
    LeftSearchResultComponent,
    ObservationBarComponent,
    LeftNavTreeComponent,
    AsyncPipe
  ],
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

  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  skillsDisabled = appConfig.featureFlags.skillsDisabled;
  observationModeCaption = $localize`Observation mode`;

  currentLanguage = this.localeService.currentLang?.tag;

  constructor(
    private store: Store,
    private sessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private injector : Injector,
    private layoutService: LayoutService,
    private localeService: LocaleService,
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
