
import { inject, Injectable, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { TabService } from 'src/app/services/tab.service';
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
import { capitalize } from 'src/app/utils/case_conversion';

const DEFAULT_TASK_VIEW_ICON = 'ph ph-file-text';

// Presentation (title + icon) for the views advertised by a task. Views not listed here fall back to a
// capitalized view name and the default icon.
const TASK_VIEW_PRESENTATIONS = new Map<string, { title: string, icon: string }>([
  [ 'task', { title: $localize`Statement`, icon: 'ph ph-file-text' }],
  [ 'editor', { title: $localize`Solve`, icon: 'ph ph-brain' }],
  [ 'hints', { title: $localize`Hints`, icon: 'ph ph-lightbulb' }],
  [ 'solution', { title: $localize`Solution`, icon: 'ph ph-check-circle' }],
  [ 'submission', { title: $localize`Submission`, icon: 'ph ph-paper-plane-tilt' }],
  [ 'forum', { title: $localize`Forum`, icon: 'ph ph-chats-circle' }],
]);

function taskViewPresentation(view: string): { title: string, icon: string } {
  return TASK_VIEW_PRESENTATIONS.get(view) ?? { title: capitalize(view), icon: DEFAULT_TASK_VIEW_ICON };
}

const contentTab = {
  title: $localize`Content`, routerLink: [], tag: 'alg-content', exactpathMatch: true, isTaskTab: true, icon: 'ph ph-article',
};
const childrenEditTab = {
  title: $localize`Content`, routerLink: [ 'edit-children' ], tag: 'alg-children-edit', isTaskTab: true, icon: 'ph ph-article',
};
const editTab = { title: $localize`Edit`, routerLink: [ 'edit' ], tag: 'alg-task-edit', icon: 'ph ph-pencil-simple' };
const progressTab = { title: $localize`Progress`, routerLink: [ 'progress' ], tag: 'alg-item-progress', icon: 'ph ph-chart-line-up' };
const historyTab = { title: $localize`History`, routerLink: [ 'history' ], tag: 'alg-log', icon: 'ph ph-clock-counter-clockwise' };
const dependenciesTab = {
  title: $localize`Dependencies`, routerLink: [ 'dependencies' ], tag: 'alg-dependencies', icon: 'ph ph-tree-structure',
};
const extraTimeTab = { title: $localize`Extra time`, routerLink: [ 'extra-time' ], tag: 'alg-extra-time', icon: 'ph ph-hourglass' };
const parametersTab = { title: $localize`Parameters`, routerLink: [ 'parameters' ], tag: 'alg-parameters', icon: 'ph ph-sliders' };
const forumTab = { title: $localize`Forum`, routerLink: [ 'forum' ], tag: 'alg-forum', icon: 'ph ph-chats-circle' };
// Task and chapter stats share the same route and component (alg-item-stats); only the tab title differs by item type.
const statsTab = { title: $localize`Statistics`, routerLink: [ 'item-stats' ], tag: 'alg-item-stats', icon: 'ph ph-chart-pie' };

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

  // list of task views (info coming from the task API, via item-display); reset when the item changes
  private taskTabs$ = new BehaviorSubject<string[]>([]);
  currentTab$ = combineLatest([ this.taskTabs$, this.tabService.activeTab$ ]).pipe(
    map(([ taskViews, activeTab ]) => (activeTab ? { isTaskTab: taskViews.includes(activeTab), tag: activeTab } : undefined)),
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
    map(([ state, taskViews, isObserving, disablePlatformProgressOnTasks, editTabEnabled, userProfile ]) => {
      if (!state.isReady) return [];

      const hasEditionPerm = state.isReady ? canCurrentUserEditAll(state.data.item) : false;
      const canViewContent = state.isReady ? canCurrentUserViewContent(state.data.item) : false;
      const canWatchResults = state.isReady ? canCurrentUserWatchResult(state.data.item) : false;
      const isTask = state.isReady ? isATask(state.data.item) : undefined;
      const isChapter = state.isReady ? isAChapter(state.data.item) : undefined;
      const canViewProgress = isObserving ? canWatchResults : canViewContent;
      const showProgress = (!isTask || !disablePlatformProgressOnTasks) && canViewProgress;
      const canSetExtraTime = state.isReady ? isTimeLimitedActivity(state.data.item) && canCurrentUserSetExtraTime(state.data.item) : false;

      const shouldHideTab = (v: string): boolean => this.config.featureFlags.hideTaskTabs.includes(v);
      // The solution tab is gated by the task itself (it advertises the 'solution' view based on its token, which the
      // backend fills according to the user's permissions/validation), so no platform-side solution filtering is needed
      // here. Only feature-flag-hidden views are dropped, and the result drives both the content-tab fallback and the
      // displayed task tabs.
      const visibleTaskViews = taskViews.filter(view => !shouldHideTab(view));

      return [
        visibleTaskViews.length === 0 && !this.isCurrentTab(childrenEditTab) ? contentTab : null,
        visibleTaskViews.length === 0 && this.isCurrentTab(childrenEditTab) ? childrenEditTab : null,
        ...visibleTaskViews.map(view => ({
          ...taskViewPresentation(view),
          routerLink: [ 'task', view ],
          tag: view,
          exactpathMatch: true,
          isTaskTab: true,
        })),
        this.isCurrentTab(editTab) || (editTabEnabled && hasEditionPerm) ? editTab : null,
        this.isCurrentTab(progressTab) || (canViewProgress && !isTask && isObserving) ? progressTab : null,
        this.isCurrentTab(historyTab) || (showProgress && (isObserving || isTask)) ? historyTab : null,
        this.isCurrentTab(dependenciesTab) || hasEditionPerm ? dependenciesTab : null,
        this.isCurrentTab(parametersTab) || hasEditionPerm ? parametersTab : null,
        this.isCurrentTab(extraTimeTab) || canSetExtraTime ? extraTimeTab : null,
        this.isCurrentTab(forumTab) || (!userProfile.tempUser && this.config.featureFlags.enableForum) ? forumTab : null,
        this.isCurrentTab(statsTab)|| ((isTask || isChapter) && hasEditionPerm && !isObserving) ? statsTab : null,
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
   * Called when a task advertises the views (tabs) to be displayed
   */
  setTaskTabs(views: string[]): void {
    this.taskTabs$.next(views);
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
