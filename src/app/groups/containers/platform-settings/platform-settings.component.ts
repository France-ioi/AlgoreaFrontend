import { Component, inject } from '@angular/core';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LocaleService } from 'src/app/services/localeService';
import { UserSessionService } from 'src/app/services/user-session.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguagePickerComponent } from 'src/app/containers/language-picker/language-picker.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-platform-settings',
  templateUrl: './platform-settings.component.html',
  styleUrls: [ './platform-settings.component.scss' ],
  imports: [
    LanguagePickerComponent,
    AsyncPipe,
  ]
})
export class PlatformSettingsComponent {
  private userSessionService = inject(UserSessionService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private localeService = inject(LocaleService);

  currentUser$ = this.userSessionService.userProfile$;

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
}
