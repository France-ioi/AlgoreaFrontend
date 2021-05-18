import { Injectable } from '@angular/core';
import { appConfig } from 'src/app/shared/helpers/config';

@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  readonly languages?: { tag: string, path: string }[];
  readonly currentTag?: string;

  constructor() {
    this.languages = appConfig.languages;
    this.currentTag = this.languages?.find(l => window.location.pathname.endsWith(l.path))?.tag;
  }

  navigateTo(langTag: string): void {
    const nextLang = this.languages?.find(l => l.tag === langTag);
    const currentLang = this.languages?.find(l => l.tag === this.currentTag);
    if (!nextLang || !currentLang) throw new Error('Cannot find new or current lang in configured languages');
    window.location.href = `${window.location.pathname.replace(currentLang.path, nextLang.path)}${window.location.hash}`;
  }

}
