import { Injectable } from '@angular/core';
import { appConfig, LanguageConfig } from 'src/app/shared/helpers/config';


@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  readonly languages: LanguageConfig[];
  readonly currentTag: string;
  readonly currentTagError: boolean

  constructor() {
    this.languages = appConfig.languages;
    const fallbackTag = appConfig.production ? '' : 'en';
    this.currentTag = this.languages.find(l => window.location.pathname.endsWith(l.path))?.tag ?? fallbackTag;
    this.currentTagError = !this.currentTag;
  }

  navigateTo(langTag: string): void {
    const nextLang = this.languages.find(l => l.tag === langTag);
    const currentLang = this.languages.find(l => l.tag === this.currentTag);

    if (!nextLang || !currentLang) throw new Error('Cannot find new or current lang in configured languages');

    const pathname = appConfig.production
      ? this.getNextPathname(currentLang, nextLang)
      : this.getNextPathnameForDevelopment(nextLang);
    window.location.href = `${pathname}${window.location.hash}`;
  }

  private getNextPathnameForDevelopment(nextLang: LanguageConfig): string {
    return nextLang.path;
  }

  private getNextPathname(currentLang: LanguageConfig, nextLang: LanguageConfig): string {
    return window.location.pathname.replace(currentLang.path, nextLang.path);
  }

}
