import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetUserService } from '../../data-access/get-user.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { catchError, delay, switchMap, map, startWith, filter, shareReplay, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { contentInfo } from 'src/app/models/content/content-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { formatUser } from 'src/app/models/user';
import { GetGroupBreadcrumbsService } from '../../data-access/get-group-breadcrumbs.service';
import { groupRoute, groupRouteFromParams, isGroupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { PlatformSettingsComponent } from '../platform-settings/platform-settings.component';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { GroupLogViewComponent } from '../group-log-view/group-log-view.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { UserIndicatorComponent } from '../user-indicator/user-indicator.component';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';

const breadcrumbHeader = $localize`Users`;

@Component({
  selector: 'alg-user',
  templateUrl: './user.component.html',
  styleUrls: [ './user.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    UserHeaderComponent,
    UserIndicatorComponent,
    RouterLinkActive,
    RouterLink,
    SectionComponent,
    GroupLogViewComponent,
    CurrentUserComponent,
    PlatformSettingsComponent,
    AsyncPipe
  ],
})
export class UserComponent implements OnInit, OnDestroy {
  @ViewChild('progress') progress?: RouterLinkActive;
  @ViewChild('personalData') personalData?: RouterLinkActive;

  private destroyed$ = new Subject<void>();
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
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

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
    private groupRouter: GroupRouter,
    private getGroupBreadcrumbsService: GetGroupBreadcrumbsService,
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.userRoute$,
      this.activeRoute$.pipe(map(p => this.pageTitle(p))),
      this.state$,
      this.breadcrumbs$.pipe(catchError(() => of(undefined))), // error is handled elsewhere
    ])
      .pipe(
        map(([ currentUserRoute, currentPageTitle, state, breadcrumbs ]) => contentInfo({
          title: state.isReady ? formatUser(state.data.user) : undefined,
          breadcrumbs: {
            category: breadcrumbHeader,
            path: state.isReady ? [
              ...(breadcrumbs?.slice(0,-1) ?? []).map(b => ({ title: b.name, navigateTo: this.groupRouter.url(b.route) })),
              { title: formatUser(state.data.user), navigateTo: this.groupRouter.url(currentUserRoute) },
              { title: currentPageTitle }
            ] : [],
            currentPageIdx: breadcrumbs ? breadcrumbs.length : 1,
          },
          route: isGroupRoute(currentUserRoute) ? currentUserRoute : undefined,
        }))
      ).subscribe(contentInfo => {
        this.currentContent.replace(contentInfo);
      });
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscription?.unsubscribe();
    this.refresh$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
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
