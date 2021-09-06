import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { combineLatest, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLinkActive } from '@angular/router';
import { delay, switchMap, map, startWith, filter, share } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { formatUser } from '../../../../shared/helpers/user';
import { LayoutService } from '../../../../shared/services/layout.service';
import { rawGroupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';

@Component({
  selector: 'alg-user',
  templateUrl: './user.component.html',
  styleUrls: [ './user.component.scss' ]
})
export class UserComponent implements OnInit, OnDestroy {
  @ViewChild('progress') progress?: RouterLinkActive;
  @ViewChild('personalData') personalData?: RouterLinkActive;

  readonly state$ = this.route.params.pipe(
    switchMap(({ id }) => this.getUserService.getForId(id)),
    mapToFetchState(),
    share(),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  fullFrameContent$ = this.layoutService.fullFrameContent$;

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
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          startWith(null),
        ),
      this.state$,
    ])
      .pipe(
        map(([ , state ]) => {
          const title = state.isFetching || state.isError ? '...' : formatUser(state.data);

          return contentInfo({
            title,
            breadcrumbs: {
              category: $localize`Users`,
              path: [
                {
                  title,
                  navigateTo: this.groupRouter.url(rawGroupRoute({ id: this.route.snapshot.params.id as string, type: 'User' })),
                },
                {
                  title: this.router.url.includes('personal-data') ? $localize`Personal info` : $localize`Progress`,
                }
              ],
              currentPageIdx: 1,
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
  }
}
