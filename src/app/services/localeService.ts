import { Location } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import { AppConfig, APPCONFIG } from 'src/app/app.config';


@Injectable({
  providedIn: 'root'
})
export class LocaleService implements OnDestroy {
  private config = inject(APPCONFIG);

  readonly languages: AppConfig['languages'];
  readonly currentLang?: AppConfig['languages'][number];
  readonly currentLangError$: Observable<Error>;

  private navigating$ = new Subject<void>();
  readonly navigatingToNewLanguage$ = this.navigating$.asObservable();

  constructor(
    private location: Location,
  ) {
    this.languages = this.config.languages;
    this.currentLang = this.languages.find(l => this.location.prepareExternalUrl('').endsWith(l.path));
    this.currentLangError$ = this.currentLang ? EMPTY : of(new Error('unable to set current lang'));
  }

  navigateTo(langTag: string): void {
    const nextLang = this.languages.find(l => l.tag === langTag);
    if (!nextLang || !this.currentLang) throw new Error('Cannot find new or current lang in configured languages');
    this.navigating$.next();
    const newRootPath = this.location.prepareExternalUrl('').replace(new RegExp(`${this.currentLang.path}$`), nextLang.path);
    window.location.href = `${newRootPath}${this.location.path().substring(1)}`;
  }

  ngOnDestroy(): void {
    this.navigating$.complete();
  }

}
