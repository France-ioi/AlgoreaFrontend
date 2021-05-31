import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mapPending } from 'src/app/shared/operators/map-pending';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-mismatch',
  templateUrl: './language-mismatch.component.html',
  styleUrls: [ './language-mismatch.component.scss' ],
})
export class LanguageMismatchComponent {

  readonly currentLanguage = this.localeService.currentLang?.tag;

  languageMismatch$ = this.sessionService.userProfile$.pipe(
    map(profile => (profile.defaultLanguage === this.currentLanguage ? undefined : {
      userDefaultLanguage: profile.defaultLanguage,
      userDefaultLanguageIsSupported: this.localeService.languages.some(({ tag }) => tag === profile.defaultLanguage),
    })),
  );
  updating$?: Observable<boolean>;

  constructor(
    private localeService: LocaleService,
    private sessionService: UserSessionService,
  ) { }

  onUpdateUserLanguage(language?: string): void {
    if (!language) throw new Error('language should be defined');
    this.updating$ = this.sessionService.updateCurrentUser({ default_language: language }).pipe(mapPending());
  }

  onVisitPlatformInUserLanguage(language: string): void {
    this.localeService.navigateTo(language);
  }

}
