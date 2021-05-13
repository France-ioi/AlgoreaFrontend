import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { CurrentUserHttpService, UserProfile } from 'src/app/shared/http-services/current-user.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UserSession, UserSessionService } from 'src/app/shared/services/user-session.service';
import { isNotNullOrUndefined } from 'src/app/shared/helpers/is-not-null-or-undefined';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { LocaleService } from '../../../../core/services/localeService';

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
    private userSessionService: UserSessionService,
    private currentUser: CurrentUserHttpService,
    private actionFeedbackService: ActionFeedbackService,
    private localeService: LocaleService,
  ) {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: currentUserBreadcrumbCat, path: [], currentPageIdx: -1 } }));
  }

  ngOnInit(): void {
    this.currentUser$ = this.userSessionService.session$.pipe(
      filter(isNotNullOrUndefined),
      map((session: UserSession) => session.user)
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

  onChangeLang(event: string): void {
    this.update({ default_language: event });
  }

  update(changes: { default_language: string }): void {
    this.currentUser.update(changes).subscribe(
      () => {
        this.actionFeedbackService.success($localize`Changes successfully saved.`);

        if (changes.default_language) {
          this.localeService.navigateTo(changes.default_language);
        }

      }, _err => {
        this.actionFeedbackService.unexpectedError();
      }
    );
  }

}
