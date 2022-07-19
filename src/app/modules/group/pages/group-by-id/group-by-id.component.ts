import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, UrlTree } from '@angular/router';
import { Subscription } from 'rxjs';
import { combineLatestWith, filter, map } from 'rxjs/operators';
import { GetGroupPathService } from 'src/app/modules/group/http-services/get-group-path.service';
import { groupInfo, GroupInfo, isGroupInfo } from 'src/app/shared/models/content/group-info';
import { readyData } from 'src/app/shared/operators/state';
import { groupRoute, groupRouteFromParams, isGroupRouteError } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { GroupDataSource } from '../../services/group-datasource.service';

const GROUP_BREADCRUMB_CAT = $localize`Groups`;

/**
 * GroupByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-group-by-id',
  templateUrl: './group-by-id.component.html',
  styleUrls: [ './group-by-id.component.scss' ],
  providers: [ GroupDataSource ],
})
export class GroupByIdComponent implements OnDestroy {

  private subscriptions: Subscription[] = []; // subscriptions to be freed up on destroy
  private hasRedirected = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private modeService: ModeService,
    private layoutService: LayoutService,
    private groupDataSource: GroupDataSource,
    private groupRouter: GroupRouter,
    private getGroupPath: GetGroupPathService,
  ) {
    this.layoutService.configure({ fullFrameActive: false });

    // on route change: refetch group if needed
    this.activatedRoute.paramMap.subscribe(params => this.fetchGroupAtRoute(params));

    // on state change, update current content page info (for breadcrumb)
    this.subscriptions.push(
      this.groupDataSource.state$.pipe(
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
        })),
      ).subscribe(p => this.currentContent.replace(p)),

      this.modeService.modeActions$.pipe(
        filter(action => [ ModeAction.StartEditing, ModeAction.StopEditing ].includes(action)),
        combineLatestWith(this.currentContent.content$.pipe(filter(isGroupInfo))),
      ).subscribe(([ action, content ]) => {
        this.groupRouter.navigateTo(content.route, { page: [ action === ModeAction.StartEditing ? 'edit' : 'details' ] });
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscriptions.forEach(s => s.unsubscribe());
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
