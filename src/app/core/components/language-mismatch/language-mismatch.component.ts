import { Component } from '@angular/core';
import { FetchState } from 'src/app/shared/helpers/state';
import { CurrentUserHttpService } from 'src/app/shared/http-services/current-user.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-mismatch',
  templateUrl: './language-mismatch.component.html',
  styleUrls: [ './language-mismatch.component.scss' ],
})
export class LanguageMismatchComponent {

  languageMismatch$ = this.localeService.languageMismatch$
  updateUserState: FetchState<object> | undefined;

  constructor(
    private localeService: LocaleService,
    private currentUserService: CurrentUserHttpService,
  ) { }

  onUpdateUserLanguage(language: string | undefined): void {
    if (!language) return;
    this.currentUserService.update({ default_language: language })
      .pipe(mapToFetchState())
      .subscribe({
        next: state => {
          this.updateUserState = state;
        },
        complete: () => {
          this.languageMismatch$.next(undefined);
        }
      });
  }

  onVisitPlatformInUserLanguage(language: string): void {
    this.localeService.navigateTo(language);
  }

}
