import { Component, inject, OnDestroy, signal } from '@angular/core';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';
import { catchError, filter, retry, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { LocaleService } from 'src/app/services/localeService';
import { UserSessionService } from 'src/app/services/user-session.service';
import { mapPending } from 'src/app/utils/operators/map-pending';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

export interface LanguageMismatchModalParams {
  userDefaultLanguage: string,
  userDefaultLanguageIsSupported: boolean,
}

@Component({
  selector: 'alg-language-mismatch-modal',
  templateUrl: './language-mismatch-modal.component.html',
  styleUrls: [ './language-mismatch-modal.component.scss' ],
  imports: [
    NotificationModalComponent,
    LoadingComponent,
    ButtonComponent,
  ]
})
export class LanguageMismatchModalComponent implements OnDestroy {
  private localeService = inject(LocaleService);
  private sessionService = inject(UserSessionService);

  params = signal(inject<LanguageMismatchModalParams>(DIALOG_DATA));

  dialogRef = inject(DialogRef);

  readonly currentLanguage = this.localeService.currentLang?.tag;

  updating = false;

  private updateTempUserLanguage = this.sessionService.userProfile$.pipe(
    filter(profile => profile.tempUser && profile.defaultLanguage !== this.currentLanguage),
    switchMap(() => (this.currentLanguage ? this.sessionService.updateCurrentUser({ default_language: this.currentLanguage }) : EMPTY)),
    retry(3),
    // An error is not that problematic, no need to break the app for the language of a temp user.
    catchError(() => EMPTY),
  ).subscribe();

  onUpdateUserLanguage(language?: string): void {
    if (!language) throw new Error('language should be defined');
    this.sessionService.updateCurrentUser({ default_language: language })
      .pipe(mapPending())
      .subscribe(updating => {
        this.updating = updating;
        if (!updating) {
          this.dialogRef.close();
        }
      });
  }

  onVisitPlatformInUserLanguage(language: string): void {
    this.localeService.navigateTo(language);
  }

  ngOnDestroy(): void {
    this.updateTempUserLanguage.unsubscribe();
  }
}
