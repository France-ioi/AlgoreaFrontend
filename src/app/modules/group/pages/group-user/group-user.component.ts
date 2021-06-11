import { Component, OnDestroy, OnInit } from '@angular/core';
import { User, GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { delay, switchMap, map, filter, startWith } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-group-user',
  templateUrl: './group-user.component.html',
  styleUrls: [ './group-user.component.scss' ]
})
export class GroupUserComponent implements OnInit, OnDestroy {
  readonly state$ = this.route.params.pipe(
    switchMap(({ id }) => this.getUser$(id)),
    mapToFetchState(),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private getUser$(id: string): Observable<User> {
    return this.getUserService.getForId(id);
  }

  private updateBreadcrumbs(): void {
    this.currentContent.current.next(contentInfo({
      breadcrumbs: {
        category: $localize`Users`,
        path: [
          {
            title: 'Login',
            navigateTo: this.router.createUrlTree([ 'groups', 'users', this.route.snapshot.params.id ]),
          },
          {
            title: this.router.url.includes('personal-data') ? $localize`Personal info` : $localize`Progress`,
          }
        ],
        currentPageIdx: -1,
      }
    }));
  }
}
