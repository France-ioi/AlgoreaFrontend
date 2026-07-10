
import { inject, Injectable, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { TabService } from 'src/app/services/tab.service';
import { TaskTab } from './containers/item-display/item-display.component';
import { APPCONFIG } from 'src/app/config';
import { isAChapter, isATask } from 'src/app/items/models/item-type';
import { canCurrentUserWatchResult } from 'src/app/items/models/item-watch-permission';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { canCurrentUserEditAll } from 'src/app/items/models/item-edit-permission';
import { isNotNull, isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { NavigationEnd, Router } from '@angular/router';
import { arraysEqual } from 'src/app/utils/array';
import { UserSessionService } from 'src/app/services/user-session.service';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from './store';
import { canCurrentUserSetExtraTime, isTimeLimitedActivity } from './models/time-limited-activity';
import { itemRouteAsUrlCommand } from '../models/routing/item-route-serialization';

const DEFAULT_TASK_VIEW_ICON = 'ph ph-file-text';

const TASK_VIEW_ICONS = new Map<string, string>([
  [ 'task', DEFAULT_TASK_VIEW_ICON ],
  [ 'editor', 'ph ph-brain' ],
  [ 'hints', 'ph ph-lightbulb' ],
  [ 'solution', 'ph ph-check-circle' ],
  [ 'submission', 'ph ph-paper-plane-tilt' ],
  [ 'forum', 'ph ph-chats-circle' ],
]);

function taskViewIcon(view: string): string {
  return TASK_VIEW_ICONS.get(view) ?? DEFAULT_TASK_VIEW_ICON;
}

const contentTab = {
  title: $localize`Content`, routerLink: [], tag: 'alg-content', exactpathMatch: true, isTaskTab: true, icon: 'ph ph-article',
};
const childrenEditTab = {
  title: $localize`Content`, routerLink: [ 'edit-children' ], tag: 'alg-children-edit', isTaskTab: true, icon: 'ph ph-article',
};
const editTab = { title: $localize`Edit`, routerLink: [ 'edit' ], tag: 'alg-task-edit', icon: 'ph ph-pencil-simple' };
const statsTab = { title: $localize`Stats`, routerLink: [ 'progress' ], tag: 'alg-item-progress', icon: 'ph ph-chart-bar' };
const historyTab = { title: $localize`History`, routerLink: [ 'history' ], tag: 'alg-log', icon: 'ph ph-clock-counter-clockwise' };
const dependenciesTab = {
  title: $localize`Dependencies`, routerLink: [ 'dependencies' ], tag: 'alg-dependencies', icon: 'ph ph-tree-structure',
};
const extraTimeTab = { title: $localize`Extra time`, routerLink: [ 'extra-time' ], tag: 'alg-extra-time', icon: 'ph ph-hourglass' };
const parametersTab = { title: $localize`Parameters`, routerLink: [ 'parameters' ], tag: 'alg-parameters', icon: 'ph ph-sliders' };
const forumTab = { title: $localize`Forum`, routerLink: [ 'forum' ], tag: 'alg-forum', icon: 'ph ph-chats-circle' };
// Task and chapter stats share the same route and component (alg-item-stats); only the tab title differs by item type.
const itemStatsTab = { routerLink: [ 'item-stats' ], tag: 'alg-item-stats', icon: 'ph ph-chart-pie' };

/**
 * Service for letting item-by-id component know what tabs and active tab to be displayed
 */
@Injectable()
export class ItemTabs implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private tabService = inject(TabService);
  private userSession = inject(UserSessionService);

  private disablePlatformProgressOnTasks$ = new BehaviorSubject<boolean>(true); /* given by the task */
  private editTabEnabled$ = new BehaviorSubject<boolean>(false);

  private taskTabs$ = new BehaviorSubject<TaskTab[]>([]); // info coming from the task API, via item-display. resetted when item changes
  currentTab$ = combineLatest([ this.taskTabs$, this.tabService.activeTab$ ]).pipe(
    map(([ taskTabs, activeTab ]) => (activeTab ? { isTaskTab: taskTabs.some(t => t.view === activeTab), tag: activeTab } : undefined)),
  );
  currentTaskView$ = this.currentTab$.pipe( // track only task tab change to keep announcing existing views to task
    filter(isNotUndefined),
    filter(t => t?.isTaskTab),
    map(t => t?.tag),
  );

  private itemState$ = this.store.select(fromItemContent.selectActiveContentData).pipe(
    filter(isNotNull),
  );
  private currentPage = this.store.selectSignal(fromItemContent.selectActiveContentPage);

  private tabs$: Observable<Parameters<TabService['setTabs']>[0]> = combineLatest([
    this.itemState$,
    this.taskTabs$,
    this.store.select(fromObservation.selectIsObserving),
    this.disablePlatformProgressOnTasks$,
    this.editTabEnabled$,
    this.userSession.userProfile$,
    // so that displayed but forbidden tabs are hidden after nav:
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => {}), startWith(undefined)),
  ]).pipe(
    debounceTime(0),
    map(([ state, taskTabs, isObserving, disablePlatformProgressOnTasks, editTabEnabled, userProfile ]) => {
      if (!state.isReady) return [];

      const hasEditionPerm = state.isReady ? canCurrentUserEditAll(state.data.item) : false;
      const canViewContent = state.isReady ? canCurrentUserViewContent(state.data.item) : false;
      const canWatchResults = state.isReady ? canCurrentUserWatchResult(state.data.item) : false;
      const isTask = state.isReady ? isATask(state.data.item) : undefined;
      const isChapter = state.isReady ? isAChapter(state.data.item) : undefined;
      const canViewStats = isObserving ? canWatchResults : canViewContent;
      const showProgress = (!isTask || !disablePlatformProgressOnTasks) && canViewStats;
      const canSetExtraTime = state.isReady ? isTimeLimitedActivity(state.data.item) && canCurrentUserSetExtraTime(state.data.item) : false;

      const shouldHideTab = (v: string): boolean => this.config.featureFlags.hideTaskTabs.includes(v);
      // The solution tab is gated by the task itself (it advertises the 'solution' view based on its token, which the
      // backend fills according to the user's permissions/validation), so no platform-side solution filtering is needed
      // here. Only feature-flag-hidden views are dropped, and the result drives both the content-tab fallback and the
      // displayed task tabs.
      const visibleTaskTabs = taskTabs.filter(({ view }) => !shouldHideTab(view));

      return [
        visibleTaskTabs.length === 0 && !this.isCurrentTab(childrenEditTab) ? contentTab : null,
        visibleTaskTabs.length === 0 && this.isCurrentTab(childrenEditTab) ? childrenEditTab : null,
        ...visibleTaskTabs.map(t => ({
          title: t.name,
          routerLink: [ 'task', t.view ],
          tag: t.view,
          exactpathMatch: true,
          isTaskTab: true,
          icon: taskViewIcon(t.view),
        })),
        this.isCurrentTab(editTab) || (editTabEnabled && hasEditionPerm) ? editTab : null,
        this.isCurrentTab(statsTab) || (canViewStats && !isTask && isObserving) ? statsTab : null,
        this.isCurrentTab(historyTab) || (showProgress && (isObserving || isTask)) ? historyTab : null,
        this.isCurrentTab(dependenciesTab) || hasEditionPerm ? dependenciesTab : null,
        this.isCurrentTab(parametersTab) || hasEditionPerm ? parametersTab : null,
        this.isCurrentTab(extraTimeTab) || canSetExtraTime ? extraTimeTab : null,
        this.isCurrentTab(forumTab) || (!userProfile.tempUser && this.config.featureFlags.enableForum) ? forumTab : null,
        this.isCurrentTab(itemStatsTab)|| ((isTask || isChapter) && hasEditionPerm && !isObserving)
          ? { ...itemStatsTab, title: isTask ? $localize`Task stats` : $localize`Chapter stats` }
          : null,
      ]
        .filter(isNotNull)
        .filter(t => !shouldHideTab(t.tag)) // uniform safety net (also lets a feature flag hide a non-task tab by tag)
        .map(t => ({ ...t, command: itemRouteAsUrlCommand(state.data.route, this.config.redirects, t.routerLink) }))
      ;
    }),
    distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
  );

  private tabUpdateSubscription = this.tabs$.pipe(
    takeUntilDestroyed(),
  ).subscribe(tabs => this.tabService.setTabs(tabs));

  private config = inject(APPCONFIG);

  /**
   * Called when a task defines the tabs to be displayed
   */
  setTaskTabs(tabs: TaskTab[]): void {
    this.taskTabs$.next(tabs);
  }

  disablePlatformProgressChanged(value: boolean): void {
    this.disablePlatformProgressOnTasks$.next(value);
  }

  editTabEnabledChange(value: boolean): void {
    this.editTabEnabled$.next(value);
  }

  itemChanged(): void {
    this.taskTabs$.next([]);
    this.disablePlatformProgressOnTasks$.next(true);
    this.editTabEnabled$.next(false);
  }

  ngOnDestroy(): void {
    this.taskTabs$.complete();
    this.editTabEnabled$.complete();
    this.disablePlatformProgressOnTasks$.complete();
  }

  private isCurrentTab(tab: { routerLink: string[] }): boolean {
    const currentPage = this.currentPage();
    if (currentPage === null) return false;
    return arraysEqual(currentPage, tab.routerLink);
  }

}
