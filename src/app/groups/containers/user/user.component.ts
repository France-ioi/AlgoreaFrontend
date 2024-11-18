import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { NavigationEnd, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { map, startWith, filter, distinctUntilChanged } from 'rxjs/operators';
import { contentInfo } from 'src/app/models/content/content-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { formatUser } from 'src/app/groups/models/user';
import { isGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { PlatformSettingsComponent } from '../platform-settings/platform-settings.component';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { GroupLogViewComponent } from '../group-log-view/group-log-view.component';
import { UserIndicatorComponent } from '../user-indicator/user-indicator.component';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { UserInfoComponent } from 'src/app/groups/containers/user-info/user-info.component';

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
    GroupLogViewComponent,
    CurrentUserComponent,
    PlatformSettingsComponent,
    AsyncPipe,
    UserInfoComponent,
    NgTemplateOutlet,
  ],
})
export class UserComponent implements OnInit, OnDestroy {
  userRoute$ = this.store.select(fromGroupContent.selectActiveContentGroupRoute).pipe(filter(isNotNull));
  state$ = this.store.select(fromGroupContent.selectActiveContentUser);

  private url$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url),
    startWith(this.router.url),
    distinctUntilChanged(),
  );
  readonly activeRoute$: Observable<'progress' | 'personal-data' | 'settings'> = this.url$.pipe(
    map(url => this.getCurrentRoute(url)),
  );

  private subscription?: Subscription;

  constructor(
    private store: Store,
    private router: Router,
    private currentContent: CurrentContentService,
    private groupRouter: GroupRouter,
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.userRoute$,
      this.activeRoute$.pipe(map(p => this.pageTitle(p))),
      this.state$,
      this.store.select(fromGroupContent.selectActiveContentBreadcrumbs),
    ])
      .pipe(
        map(([ currentUserRoute, currentPageTitle, state, breadcrumbs ]) => contentInfo({
          title: state.isReady ? formatUser(state.data) : undefined,
          breadcrumbs: {
            category: breadcrumbHeader,
            path: state.isReady ? [
              ...(breadcrumbs?.data?.slice(0,-1) ?? []).map(b => ({ title: b.name, navigateTo: this.groupRouter.url(b.route) })),
              { title: formatUser(state.data), navigateTo: this.groupRouter.url(currentUserRoute) },
              { title: currentPageTitle }
            ] : [],
            currentPageIdx: breadcrumbs !== null && breadcrumbs.isReady ? breadcrumbs.data.length : 1,
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
  }

  refresh(): void {
    this.store.dispatch(fromGroupContent.userPageActions.refresh());
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
