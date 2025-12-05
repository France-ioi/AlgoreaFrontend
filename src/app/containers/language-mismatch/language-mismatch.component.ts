import { Component, effect, inject } from '@angular/core';
import { filter, map, takeUntil } from 'rxjs/operators';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import {
  LanguageMismatchModalComponent
} from 'src/app/containers/language-mismatch/language-mismatch-modal/language-mismatch-modal.component';

@Component({
  selector: 'alg-language-mismatch',
  templateUrl: './language-mismatch.component.html',
  styleUrls: [ './language-mismatch.component.scss' ],
  standalone: true,
})
export class LanguageMismatchComponent {
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

  constructor(
    private localeService: LocaleService,
    private sessionService: UserSessionService,
  ) { }

}
