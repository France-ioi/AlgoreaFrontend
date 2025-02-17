import { Component, OnDestroy } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError, filter, map, retry, switchMap, takeUntil } from 'rxjs/operators';
import { mapPending } from 'src/app/utils/operators/map-pending';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { SharedModule } from 'primeng/api';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { DialogModule } from 'primeng/dialog';
import { NgIf, AsyncPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-language-mismatch',
  templateUrl: './language-mismatch.component.html',
  styleUrls: [ './language-mismatch.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    DialogModule,
    LoadingComponent,
    SharedModule,
    AsyncPipe,
    ButtonComponent,
  ],
})
export class LanguageMismatchComponent implements OnDestroy {

  readonly currentLanguage = this.localeService.currentLang?.tag;

  languageMismatch$ = this.sessionService.userProfile$.pipe(
    filter(profile => !profile.tempUser),
    map(profile => (profile.defaultLanguage === this.currentLanguage ? undefined : {
      userDefaultLanguage: profile.defaultLanguage,
      userDefaultLanguageIsSupported: this.localeService.languages.some(({ tag }) => tag === profile.defaultLanguage),
    })),
    takeUntil(this.localeService.navigatingToNewLanguage$),
  );
  updating = false;

  private updateTempUserLanguage = this.sessionService.userProfile$.pipe(
    filter(profile => profile.tempUser && profile.defaultLanguage !== this.currentLanguage),
    switchMap(() => (this.currentLanguage ? this.sessionService.updateCurrentUser({ default_language: this.currentLanguage }) : EMPTY)),
    retry(3),
    // An error is not that problematic, no need to break the app for the language of a temp user.
    catchError(() => EMPTY),
  ).subscribe();

  constructor(
    private localeService: LocaleService,
    private sessionService: UserSessionService,
  ) { }

  onUpdateUserLanguage(language?: string): void {
    if (!language) throw new Error('language should be defined');
    this.sessionService.updateCurrentUser({ default_language: language })
      .pipe(mapPending())
      .subscribe(updating => (this.updating = updating));
  }

  onVisitPlatformInUserLanguage(language: string): void {
    this.localeService.navigateTo(language);
  }

  ngOnDestroy(): void {
    this.updateTempUserLanguage.unsubscribe();
  }

}
