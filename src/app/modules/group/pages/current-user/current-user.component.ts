import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UserSession, UserSessionService } from 'src/app/shared/services/user-session.service';
import { inputIsNotNullOrUndefined } from 'src/app/shared/helpers/input-is-not-null-or-undefined';

const currentUserBreadcrumbCat = $localize`Yourself`;

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent implements OnInit, OnDestroy {
  currentUser$?: Observable<UserProfile>;

  constructor(
    private currentContent: CurrentContentService,
    private userSessionService: UserSessionService
  ) {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: currentUserBreadcrumbCat, path: [], currentPageIdx: -1 } }));
  }

  ngOnInit(): void {
    this.currentUser$ = this.userSessionService.session$.pipe(
      filter(inputIsNotNullOrUndefined),
      map((session: UserSession) => session.user)
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

}
