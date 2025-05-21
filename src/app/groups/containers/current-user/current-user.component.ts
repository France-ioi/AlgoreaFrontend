import { Component, inject } from '@angular/core';
import { UserSessionService } from 'src/app/services/user-session.service';
import { APPCONFIG } from 'src/app/app.config';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Location, NgIf, AsyncPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    ButtonComponent,
  ],
})
export class CurrentUserComponent {
  private config = inject(APPCONFIG);
  currentUser$ = this.userSessionService.userProfile$;

  constructor(
    private userSessionService: UserSessionService,
    private actionFeedbackService: ActionFeedbackService,
    private location: Location,
  ) {}

  onModify(userId: string): void {
    const backUrl = window.location.origin + this.location.prepareExternalUrl('update-profile.html');
    window.open(
      `${ this.config.oauthServerUrl }?all=1&client_id=${ userId }&redirect_uri=${encodeURI(backUrl)}`,
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
