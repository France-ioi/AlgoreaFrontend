import { Injectable } from '@angular/core';
import { appConfig, Language } from 'src/app/shared/helpers/config';


@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  readonly languages: Language[];
  readonly currentTag: string;

  constructor() {
    this.languages = appConfig.languages;
    const fallbackTag = appConfig.production ? '' : 'en';
    this.currentTag = this.languages.find(l => window.location.pathname.endsWith(l.path))?.tag ?? fallbackTag;
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

  private getNextPathnameForDevelopment(nextLang: Language): string {
    return nextLang.path;
  }

  private getNextPathname(currentLang: Language, nextLang: Language): string {
    return window.location.pathname.replace(currentLang.path, nextLang.path);
  }

}
