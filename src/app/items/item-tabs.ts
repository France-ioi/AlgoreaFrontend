
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { TabService } from 'src/app/services/tab.service';
import { TaskTab } from './containers/item-display/item-display.component';
import { appConfig } from 'src/app/utils/config';
import { isATask } from 'src/app/models/item-type';
import { allowsWatchingResults } from 'src/app/models/item-watch-permission';
import { canCurrentUserViewContent, canCurrentUserViewSolution } from 'src/app/models/item-view-permission';
import { allowsEditingAll } from 'src/app/models/item-edit-permission';
import { GroupWatchingService } from 'src/app/services/group-watching.service';
import { ItemDataSource } from './services/item-datasource.service';
import { isNotNull, isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { NavigationEnd, Router } from '@angular/router';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { arraysEqual } from 'src/app/utils/array';
import { urlArrayForItemRoute } from 'src/app/models/routing/item-route';
import { UserSessionService } from 'src/app/services/user-session.service';

const contentTab = { title: $localize`Content`, routerLink: [], tag: 'alg-content', exactpathMatch: true };
const childrenEditTab = { title: $localize`Content`, routerLink: [ 'edit-children' ], tag: 'alg-children-edit' };
const editTab = { title: $localize`Edit`, routerLink: [ 'edit' ], tag: 'alg-task-edit' };
const statsTab = { title: $localize`Stats`, routerLink: [ 'progress', 'chapter' ], tag: 'alg-chapter-progress' };
const historyTab = { title: $localize`History`, routerLink: [ 'progress', 'history' ], tag: 'alg-log' };
const dependenciesTab = { title: $localize`Dependencies`, routerLink: [ 'dependencies' ], tag: 'alg-dependencies' };
const parametersTab = { title: $localize`Parameters`, routerLink: [ 'parameters' ], tag: 'alg-parameters' };
const forumTab = { title: $localize`Forum`, routerLink: [ 'forum' ], tag: 'alg-forum' };

const solutionTabView = 'solution'; // 'view' name used by tasks for the solution tab

/**
 * Service for letting item-by-id component know what tabs and active tab to be displayed
 */
@Injectable()
export class ItemTabs implements OnDestroy {

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

  private tabs$: Observable<Parameters<TabService['setTabs']>[0]> = combineLatest([
    this.itemDataSource.state$,
    this.taskTabs$,
    this.groupWatchingService.watchedGroup$,
    this.disablePlatformProgressOnTasks$,
    this.editTabEnabled$,
    this.userSession.userProfile$,
    // so that displayed but forbidden tabs are hidden after nav:
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => {}), startWith(undefined)),
  ]).pipe(
    debounceTime(0),
    map(([ state, taskTabs, watchedGroup, disablePlatformProgressOnTasks, editTabEnabled, userProfile ]) => {
      if (!state.isReady) return [];

      const hasEditionPerm = state.isReady ? allowsEditingAll(state.data.item.permissions) : false;
      const canViewContent = state.isReady ? canCurrentUserViewContent(state.data.item) : false;
      const canViewSolution = state.isReady ? canCurrentUserViewSolution(state.data.item, state.data.currentResult) : false;
      const canWatchResults = state.isReady ? allowsWatchingResults(state.data.item.permissions) : false;
      const isTask = state.isReady ? isATask(state.data.item) : undefined;
      const canViewStats = watchedGroup ? canWatchResults : canViewContent;
      const showProgress = (!isTask || !disablePlatformProgressOnTasks) && canViewStats;

      const shouldHideTab = (v: string): boolean => appConfig.featureFlags.hideTaskTabs.includes(v);
      const filteredTaskTabs = taskTabs.filter(({ view }) => !shouldHideTab(view) && (canViewSolution || view !== solutionTabView));

      return [
        filteredTaskTabs.length === 0 && !this.isCurrentTab(childrenEditTab) ? contentTab : null,
        filteredTaskTabs.length === 0 && this.isCurrentTab(childrenEditTab) ? childrenEditTab : null,
        ...taskTabs.map(t => ({ title: t.name, routerLink: [], tag: t.view })),
        this.isCurrentTab(editTab) || (editTabEnabled && hasEditionPerm) ? editTab : null,
        this.isCurrentTab(statsTab) || canViewStats && !isTask ? statsTab : null,
        this.isCurrentTab(historyTab) || showProgress ? historyTab : null,
        this.isCurrentTab(dependenciesTab) || hasEditionPerm ? dependenciesTab : null,
        this.isCurrentTab(parametersTab) || hasEditionPerm ? parametersTab : null,
        this.isCurrentTab(forumTab) || (!userProfile.tempUser && !!appConfig.forumServerUrl) ? forumTab : null,
      ]
        .filter(isNotNull)
        .filter(t => !shouldHideTab(t.tag))
        .map(t => ({ ...t, command: urlArrayForItemRoute(state.data.route, t.routerLink) }))
      ;
    }),
    distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
  );

  private tabUpdateSubscription = this.tabs$.subscribe(tabs => this.tabService.setTabs(tabs));

  constructor(
    private router: Router,
    private itemRouter: ItemRouter,
    private itemDataSource: ItemDataSource,
    private tabService: TabService,
    private groupWatchingService: GroupWatchingService,
    private userSession: UserSessionService,
  ) {}

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
    this.tabUpdateSubscription.unsubscribe();
    this.taskTabs$.complete();
    this.editTabEnabled$.complete();
    this.disablePlatformProgressOnTasks$.complete();
  }

  private isCurrentTab(tab: { routerLink: string[] }): boolean {
    return arraysEqual(this.itemRouter.currentItemPage() ?? [], tab.routerLink);
  }

}
