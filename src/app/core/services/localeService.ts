import { Injectable } from '@angular/core';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import { appConfig, LanguageConfig } from 'src/app/shared/helpers/config';


@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  readonly languages: LanguageConfig[];
  readonly currentLang?: LanguageConfig;
  readonly currentLangError$: Observable<void>;

  private navigating$ = new Subject<void>();
  readonly navigatingToNewLanguage$ = this.navigating$.asObservable();

  constructor() {
    this.languages = appConfig.languages;
    this.currentLang = this.languages.find(l => window.location.pathname.endsWith(l.path));
    this.currentLangError$ = this.currentLang ? EMPTY : of(undefined);
  }

  navigateTo(langTag: string): void {
    const nextLang = this.languages.find(l => l.tag === langTag);
    if (!nextLang || !this.currentLang) throw new Error('Cannot find new or current lang in configured languages');
    this.navigating$.next();
    window.location.href = `${window.location.pathname.replace(this.currentLang.path, nextLang.path)}${window.location.hash}`;
  }

}
