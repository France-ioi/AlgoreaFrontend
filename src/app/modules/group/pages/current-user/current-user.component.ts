import { Component } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Location, NgIf, AsyncPipe } from '@angular/common';
import { SectionComponent } from '../../../shared-components/components/section/section.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ButtonModule,
    SectionComponent,
    AsyncPipe,
  ],
})
export class CurrentUserComponent {
  currentUser$ = this.userSessionService.userProfile$;

  constructor(
    private userSessionService: UserSessionService,
    private actionFeedbackService: ActionFeedbackService,
    private location: Location,
  ) {}

  onModify(userId: string): void {
    const backUrl = window.location.origin + this.location.prepareExternalUrl('update-profile.html');
    window.open(
      `${ appConfig.oauthServerUrl }?all=1&client_id=${ userId }&redirect_uri=${encodeURI(backUrl)}`,
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
