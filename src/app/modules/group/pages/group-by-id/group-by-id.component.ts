import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLinkActive, UrlTree } from '@angular/router';
import { map } from 'rxjs/operators';
import { GetGroupPathService } from 'src/app/modules/group/http-services/get-group-path.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { groupInfo, GroupInfo } from 'src/app/shared/models/content/group-info';
import { mapStateData, readyData } from 'src/app/shared/operators/state';
import { groupRoute, groupRouteFromParams, isGroupRouteError } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { GroupDataSource } from '../../services/group-datasource.service';
import { GroupEditComponent } from '../group-edit/group-edit.component';

const GROUP_BREADCRUMB_CAT = $localize`Groups`;

@Component({
  selector: 'alg-group-by-id',
  templateUrl: './group-by-id.component.html',
  styleUrls: [ './group-by-id.component.scss' ],
  providers: [ GroupDataSource ],
})
export class GroupByIdComponent implements OnInit, OnDestroy {

  state$ = this.groupDataSource.state$.pipe(mapStateData(state => ({
    ...state,
    group: withManagementAdditions(state.group),
  })));
  fullFrame$ = this.layoutService.fullFrame$;
  hideAccessTab = !appConfig.featureFlags.showGroupAccessTab;

  // use of ViewChild required as these elements are shown under some conditions, so may be undefined
  @ViewChild('overviewTab') overviewTab?: RouterLinkActive;
  @ViewChild('compositionTab') compositionTab?: RouterLinkActive;
  @ViewChild('adminTab') adminTab?: RouterLinkActive;
  @ViewChild('settingsTab') settingsTab?: RouterLinkActive;
  @ViewChild('accessTab') accessTab?: RouterLinkActive;
  @ViewChild('groupEdit') groupEdit?: GroupEditComponent;

  // on state change, update current content page info (for breadcrumb)
  private groupToCurrentContentSubscription = this.groupDataSource.state$.pipe(
    readyData(),
    map(({ group, route, breadcrumbs }): GroupInfo => groupInfo({
      route: route,
      breadcrumbs: {
        category: GROUP_BREADCRUMB_CAT,
        path: breadcrumbs.map(breadcrumb => ({
          title: breadcrumb.name,
          navigateTo: (): UrlTree => this.groupRouter.url(breadcrumb.route),
        })),
        currentPageIdx: breadcrumbs.length - 1,
      },
      title: group.name,
      currentUserCanWatchMembers: group.currentUserCanWatchMembers,
      currentUserCanGrantGroupAccess: group.currentUserCanGrantGroupAccess,
    })),
  ).subscribe(p => this.currentContent.replace(p));

  private hasRedirected = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private layoutService: LayoutService,
    private groupDataSource: GroupDataSource,
    private groupRouter: GroupRouter,
    private getGroupPath: GetGroupPathService,
    private currentContentService: CurrentContentService,
  ) {
    // on route change: refetch group if needed
    this.activatedRoute.paramMap.subscribe(params => this.fetchGroupAtRoute(params));
  }

  ngOnInit(): void {
    this.layoutService.configure({ fullFrameActive: false });
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.groupToCurrentContentSubscription.unsubscribe();
  }

  isDirty(): boolean {
    return !!this.groupEdit?.isDirty();
  }

  refreshNav(): void {
    this.currentContentService.forceNavMenuReload();
  }

  onGroupRefreshRequired(): void {
    this.groupDataSource.refetchGroup();
    this.refreshNav();
  }

  private fetchGroupAtRoute(params: ParamMap): void {
    const route = groupRouteFromParams(params);

    if (isGroupRouteError(route)) {
      if (!route.id) throw new Error('a group id is required to open group details');
      if (this.hasRedirected) throw new Error('too many redirections');
      else this.solveMissingPathAttempt(route.id);
      return;
    }

    this.hasRedirected = false;
    this.currentContent.replace(groupInfo({
      route,
      breadcrumbs: { category: GROUP_BREADCRUMB_CAT, path: [], currentPageIdx: -1 },
    }));
    this.groupDataSource.fetchGroup(route);
  }

  private solveMissingPathAttempt(groupId: string): void {
    this.getGroupPath.getGroupPath(groupId).subscribe({
      next: path => {
        this.hasRedirected = true;
        this.groupRouter.navigateTo(groupRoute({ id: groupId, isUser: false }, path), { navExtras: { replaceUrl: true } });
      },
      error: () => {
        this.groupRouter.navigateTo(groupRoute({ id: groupId, isUser: false }, []), { navExtras: { replaceUrl: true } });
      }
    });
  }
}
