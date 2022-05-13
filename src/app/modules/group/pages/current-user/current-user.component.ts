import { Component } from '@angular/core';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { LocaleService } from '../../../../core/services/localeService';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent {
  currentUser$ = this.userSessionService.userProfile$;

  constructor(
    private userSessionService: UserSessionService,
    private actionFeedbackService: ActionFeedbackService,
    private localeService: LocaleService,
  ) {}

  onChangeLang(event: string): void {
    this.update({ default_language: event });
  }

  update(changes: { default_language: string }): void {
    this.userSessionService.updateCurrentUser(changes).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`Changes successfully saved.`);

        if (changes.default_language) {
          this.localeService.navigateTo(changes.default_language);
        }
      },
      error: err => {
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  onModify(userId: string): void {
    window.open(
      `${ environment.oauthServerUrl }?all=1&client_id=${ userId }&redirect_uri=${encodeURI(`${ location.origin }/update-profile.html`)}`,
      undefined,
      'popup,width=800,height=640'
    );

    const onProfileUpdated = (): void => {
      this.userSessionService.refresh().subscribe();
      window.removeEventListener('profileUpdated', onProfileUpdated);
    };

    window.addEventListener('profileUpdated', onProfileUpdated);
  }

}
