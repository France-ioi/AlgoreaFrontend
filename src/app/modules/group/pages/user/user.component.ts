import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState, readyData } from '../../../../shared/operators/state';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLinkActive } from '@angular/router';
import { catchError, delay, switchMap, map, startWith, filter, share, distinctUntilChanged } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { formatUser } from '../../../../shared/helpers/user';
import { LayoutService } from '../../../../shared/services/layout.service';
import { GetGroupBreadcrumbsService } from '../../http-services/get-group-breadcrumbs.service';
import { groupRoute, groupRouteFromParams, isGroupRoute, rawGroupRoute } from 'src/app/shared/routing/group-route';
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
  private readonly userRoute$ = this.route.paramMap.pipe(
    map(params => {
      const { id, path } = groupRouteFromParams(params);
      if (!id) throw new Error('expected user id is user page path');
      const group = { id, isUser: true };
      return path ? groupRoute(group, path) : rawGroupRoute(group);
    })
  );

  readonly state$ = this.userRoute$.pipe(
    switchMap(route => this.getUserService.getForId(route.id).pipe(map(user => ({ route: route, user: user })))),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  readonly fullFrame$ = this.layoutService.fullFrame$;

  private url$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url),
    startWith(this.router.url),
    distinctUntilChanged(),
  );
  readonly activeRoute$: Observable<'progress' | 'personal-data' | 'settings'> = this.url$.pipe(
    map(url => this.getCurrentRoute(url)),
  );

  private readonly breadcrumbs$ = this.userRoute$.pipe(
    switchMap(route => (isGroupRoute(route) ? this.getGroupBreadcrumbsService.getBreadcrumbs(route) : of(undefined)))
  );

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private layoutService: LayoutService,
    private groupRouter: GroupRouter,
    private getGroupBreadcrumbsService: GetGroupBreadcrumbsService,
  ) {
    this.layoutService.configure({ fullFrameActive: false });
  }

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.userRoute$,
      this.activeRoute$.pipe(map(p => this.pageTitle(p))),
      this.state$.pipe(readyData()),
      this.breadcrumbs$.pipe(catchError(() => of(undefined))), // error is handled elsewhere
    ])
      .pipe(
        map(([ currentUserRoute, currentPageTitle, data, breadcrumbs ]) => contentInfo({
          title: formatUser(data.user),
          breadcrumbs: {
            category: $localize`Users`,
            path: [
              ...(breadcrumbs?.slice(0,-1) ?? []).map(b => ({ title: b.name, navigateTo: this.groupRouter.url(b.route) })),
              { title: formatUser(data.user), navigateTo: this.groupRouter.url(currentUserRoute) },
              { title: currentPageTitle }
            ],
            currentPageIdx: breadcrumbs ? breadcrumbs.length : 1,
          }
        }))
      ).subscribe(contentInfo => {
        this.currentContent.replace(contentInfo);
      });
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscription?.unsubscribe();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  /**
   * Return the i18n title of a page
   */
  private pageTitle(page: 'progress' | 'personal-data' | 'settings'): string {
    switch (page) {
      case 'progress': return $localize`Progress`;
      case 'personal-data': return $localize`Personal info`;
      case 'settings': return $localize`Settings`;
    }
  }

  private getCurrentRoute(url: string): 'progress' | 'personal-data' | 'settings' {
    if (url.endsWith('/personal-data')) {
      return 'personal-data';
    } else if (url.endsWith('/settings')) {
      return 'settings';
    }
    return 'progress';
  }
}
