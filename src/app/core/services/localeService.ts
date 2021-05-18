import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

export interface LanguageMismatch {
  platformLanguage: string | undefined,
  userDefaultLanguage: string,
  userDefaultLanguageIsSupported: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LocaleService implements OnDestroy {

  readonly languages?: { tag: string, path: string }[];
  readonly currentTag?: string;
  readonly languageMismatch$ = new BehaviorSubject<LanguageMismatch | undefined>(undefined)

  private userSessionSubscription: Subscription

  constructor(private userSession: UserSessionService) {
    this.languages = appConfig().languages;
    this.currentTag = this.languages?.find(l => window.location.pathname.endsWith(l.path))?.tag;

    this.userSessionSubscription = this.userSession.session$.subscribe(session => {
      if (!session) return;

      const userDefaultLanguage = session.user.defaultLanguage;
      const hasLanguageMismatch = !!this.currentTag && session.user.defaultLanguage !== this.currentTag;
      if (hasLanguageMismatch) {
        this.languageMismatch$.next({
          platformLanguage: this.currentTag,
          userDefaultLanguage,
          userDefaultLanguageIsSupported: this.languages?.some(({ tag }) => tag === userDefaultLanguage) ?? false,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSessionSubscription.unsubscribe();
  }

  navigateTo(langTag: string): void {
    const nextLang = this.languages?.find(l => l.tag === langTag);
    const currentLang = this.languages?.find(l => l.tag === this.currentTag);
    if (!nextLang) throw new Error('Cannot find new or current lang in configured languages');
    const pathname = currentLang && window.location.pathname.includes(currentLang.path)
      ? window.location.pathname.replace(currentLang.path, nextLang.path)
      : nextLang.path;
    window.location.href = `${pathname}${window.location.hash}`;
  }

}
