import { Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { EMPTY } from 'rxjs';
import { catchError, filter, map, retry, switchMap, take, takeUntil } from 'rxjs/operators';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { UserLanguageService } from '../../services/user-language.service';
import {
  LanguageMismatchModalComponent
} from 'src/app/containers/language-mismatch/language-mismatch-modal/language-mismatch-modal.component';

@Component({
  selector: 'alg-language-mismatch',
  templateUrl: './language-mismatch.component.html',
  styleUrl: './language-mismatch.component.scss',
})
export class LanguageMismatchComponent {
  private localeService = inject(LocaleService);
  private sessionService = inject(UserSessionService);
  private userLanguageService = inject(UserLanguageService);
  private dialogService = inject(Dialog);

  readonly currentLanguage = this.localeService.currentLang?.tag;

  languageMismatch$ = this.sessionService.userProfile$.pipe(
    filter(profile => !profile.tempUser),
    map(profile => (profile.defaultLanguage === this.currentLanguage ? undefined : {
      userDefaultLanguage: profile.defaultLanguage,
      userDefaultLanguageIsSupported: this.localeService.languages.some(({ tag }) => tag === profile.defaultLanguage),
    })),
    takeUntil(this.localeService.navigatingToNewLanguage$),
  );
  languageMismatch = toSignal(this.languageMismatch$);

  openModalEffect = effect(() => {
    const languageMismatch = this.languageMismatch();
    if (languageMismatch) {
      this.dialogService.open(LanguageMismatchModalComponent, { disableClose: true, data: languageMismatch });
    }
  });

  constructor() {
    const language = this.currentLanguage;
    if (!language) return;

    // Temp users: silently align profile language with site language (once per load). No modal.
    this.sessionService.userProfile$.pipe(
      filter(profile => profile.tempUser && profile.defaultLanguage !== language),
      take(1),
      switchMap(() => this.userLanguageService.setUserLanguage(language)),
      retry(3),
      // An error is not that problematic, no need to break the app for the language of a temp user.
      catchError(() => EMPTY),
      takeUntil(this.localeService.navigatingToNewLanguage$),
      takeUntilDestroyed(),
    ).subscribe();
  }
}
