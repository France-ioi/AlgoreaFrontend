import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';
import { LocaleService } from 'src/app/services/localeService';
import { UserLanguageService } from 'src/app/services/user-language.service';
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
  styleUrl: './language-mismatch-modal.component.scss',
  imports: [
    NotificationModalComponent,
    LoadingComponent,
    ButtonComponent,
  ]
})
export class LanguageMismatchModalComponent {
  private localeService = inject(LocaleService);
  private userLanguageService = inject(UserLanguageService);
  private destroyRef = inject(DestroyRef);

  params = signal(inject<LanguageMismatchModalParams>(DIALOG_DATA));

  dialogRef = inject(DialogRef);

  readonly currentLanguage = this.localeService.currentLang?.tag;

  protected readonly updating = signal(false);

  onUpdateUserLanguage(language?: string): void {
    if (!language) throw new Error('language should be defined');
    this.userLanguageService.setUserLanguage(language)
      .pipe(
        mapPending(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(updating => {
        this.updating.set(updating);
        if (!updating) {
          this.dialogRef.close();
        }
      });
  }

  onVisitPlatformInUserLanguage(language: string): void {
    this.localeService.navigateTo(language);
  }
}
