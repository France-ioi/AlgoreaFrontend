import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { NavigationEnd, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { map, startWith, filter, distinctUntilChanged } from 'rxjs/operators';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { formatUser } from 'src/app/groups/models/user';
import { isGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { PlatformSettingsComponent } from '../platform-settings/platform-settings.component';
import { GroupLogViewComponent } from '../group-log-view/group-log-view.component';
import { UserIndicatorComponent } from '../user-indicator/user-indicator.component';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { UserInfoComponent } from 'src/app/groups/containers/user-info/user-info.component';
import { userInfo } from 'src/app/models/content/group-info';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

@Component({
  selector: 'alg-user',
  templateUrl: './user.component.html',
  styleUrls: [ './user.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    UserHeaderComponent,
    UserIndicatorComponent,
    RouterLinkActive,
    RouterLink,
    GroupLogViewComponent,
    PlatformSettingsComponent,
    AsyncPipe,
    UserInfoComponent,
  ]
})
export class UserComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private currentContent = inject(CurrentContentService);
  private groupRouter = inject(GroupRouter);

  userRoute$ = this.store.select(fromGroupContent.selectActiveContentRoute).pipe(filter(isNotNull));
  state$ = this.store.select(fromGroupContent.selectActiveContentUserState);

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

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.userRoute$,
      this.activeRoute$.pipe(map(p => this.pageTitle(p))),
      this.state$,
      this.store.select(fromGroupContent.selectActiveContentBreadcrumbsState),
    ])
      .subscribe(([ currentUserRoute, currentPageTitle, state, breadcrumbs ]) => {
        this.currentContent.replace(userInfo({
          route: isGroupRoute(currentUserRoute) ? currentUserRoute : undefined,
        }));
        this.store.dispatch(fromCurrentContent.contentPageActions.changeContent({
          route: 'user-by-id',
          title: state.isReady ? formatUser(state.data) : undefined,
          breadcrumbs: state.isReady ? [
            ...(breadcrumbs?.data?.slice(0,-1) ?? []).map(b => ({
              title: b.name,
              navigateTo: (): void => this.groupRouter.navigateTo(b.route)
            })),
            { title: formatUser(state.data), navigateTo: (): void => this.groupRouter.navigateTo(currentUserRoute) },
            { title: currentPageTitle }
          ] : undefined
        }));
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
