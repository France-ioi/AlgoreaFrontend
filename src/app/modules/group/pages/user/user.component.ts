import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { delay, switchMap, map } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { formatUser } from '../../../../shared/helpers/user';

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
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  private subscription?: Subscription;

  isInitPagePersonal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.state$
      .pipe(
        map(state => contentInfo({
          breadcrumbs: {
            category: $localize`Users`,
            path: [
              {
                title: state.isFetching || state.isError ? '...' : formatUser(state.data),
                navigateTo: this.router.createUrlTree([ 'groups', 'users', this.route.snapshot.params.id ]),
              },
              {
                title: this.router.url.includes('personal-data') ? $localize`Personal info` : $localize`Progress`,
              }
            ],
            currentPageIdx: -1,
          }
        }))
      )
      .subscribe(contentInfo => {
        this.currentContent.current.next(contentInfo);
      });

    this.isInitPagePersonal = this.router.url.includes('personal-data');
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscription?.unsubscribe();
  }
}
