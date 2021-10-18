import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { combineLatest, of, Subject, Subscription, throwError } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLinkActive } from '@angular/router';
import { delay, switchMap, map, startWith, filter, share } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { formatUser } from '../../../../shared/helpers/user';
import { LayoutService } from '../../../../shared/services/layout.service';
import { GetGroupBreadcrumbsService } from '../../http-services/get-group-breadcrumbs.service';
import { groupRoute, groupRouteFromParams, rawGroupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';

@Component({
  selector: 'alg-user',
  templateUrl: './user.component.html',
  styleUrls: [ './user.component.scss' ]
})
export class UserComponent implements OnInit, OnDestroy {
  @ViewChild('progress') progress?: RouterLinkActive;
  @ViewChild('personalData') personalData?: RouterLinkActive;

  private refresh$ = new Subject<void>();
  readonly state$ = this.route.params.pipe(
    switchMap(({ id }) => this.getUserService.getForId(id)),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  fullFrameContent$ = this.layoutService.fullFrameContent$;

  private readonly breadcrumbs$ = this.route.paramMap.pipe(
    switchMap(params => {
      const { id, path } = groupRouteFromParams(params);
      if (!id) return throwError(new Error('user id must be defined'));
      return path
        ? this.getGroupBreadcrumbsService.getBreadcrumbs(groupRoute({ id, isUser: true }, path))
        : of(undefined);
    })
  );

  private subscription?: Subscription;

  isInitPagePersonal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private layoutService: LayoutService,
    private groupRouter: GroupRouter,
    private getGroupBreadcrumbsService: GetGroupBreadcrumbsService,
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          startWith(null),
        ),
      this.state$,
      this.breadcrumbs$,
    ])
      .pipe(
        map(([ , state, breadcrumbs ]) => {
          const title = state.isFetching || state.isError ? '...' : formatUser(state.data);
          const lastPath = {
            title: this.router.url.includes('personal-data') ? $localize`Personal info` : $localize`Progress`,
          };

          return contentInfo({
            title,
            breadcrumbs: {
              category: $localize`Users`,
              path: breadcrumbs ? [
                ...breadcrumbs.map(breadcrumb => ({
                  title: breadcrumb.type === 'User' && breadcrumb.id === state.data?.groupId
                    ? formatUser(state.data)
                    : breadcrumb.name,
                  navigateTo: this.groupRouter.url(breadcrumb.route),
                })),
                lastPath,
              ] : [
                {
                  title,
                  navigateTo: this.groupRouter.url(rawGroupRoute({ id: this.route.snapshot.params.id as string, isUser: true })),
                },
                lastPath,
              ],
              currentPageIdx: breadcrumbs ? breadcrumbs.length : 1,
            }
          });
        })
      )
      .subscribe(contentInfo => {
        this.currentContent.replace(contentInfo);
      });

    this.isInitPagePersonal = this.router.url.includes('personal-data');
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscription?.unsubscribe();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
