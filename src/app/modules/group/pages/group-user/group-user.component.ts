import { Component, OnInit } from '@angular/core';
import { User, GetUserService } from '../../http-services/get-user.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { delay, switchMap, map } from 'rxjs/operators';
import { contentInfo } from '../../../../shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-group-user',
  templateUrl: './group-user.component.html',
  styleUrls: [ './group-user.component.scss' ]
})
export class GroupUserComponent implements OnInit {
  readonly state$ = this.route.params.pipe(
    switchMap(({ id }) => this.getUser$(id)),
    mapToFetchState(),
  );

  readonly currentUserGroupId$ = this.userSessionService.userProfile$.pipe(
    delay(0),
    map(userProfile => userProfile.groupId),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(({ id }) => {
      this.currentContent.current.next(contentInfo({
        breadcrumbs: {
          category: $localize`Users`,
          path: [
            {
              title: 'Login',
              navigateTo: this.router.createUrlTree([ 'groups', 'users', id ]),
            },
            {
              title: $localize`Progress`,
            }
          ],
          currentPageIdx: -1,
        }
      }));
    });
  }

  getUser$(id: string): Observable<User> {
    return this.getUserService.getForId(id);
  }
}
