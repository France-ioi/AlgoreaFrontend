import { Component } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { environment } from '../../../../../environments/environment';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  ) {}

  onModify(userId: string): void {
    const backUrl = new URL(
      './update-profile.html',
      location.href
    ).href;

    window.open(
      `${ environment.oauthServerUrl }?all=1&client_id=${ userId }&redirect_uri=${encodeURI(backUrl)}`,
      undefined,
      'popup,width=800,height=640'
    );

    const onProfileUpdated = (): void => {
      this.userSessionService.refresh().subscribe({
        error: err => {
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
      window.removeEventListener('profileUpdated', onProfileUpdated);
    };

    window.addEventListener('profileUpdated', onProfileUpdated);
  }

}
