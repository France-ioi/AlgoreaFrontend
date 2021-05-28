import { Component, Input, OnChanges, Output, EventEmitter, OnInit } from '@angular/core';
import { LanguageConfig } from 'src/app/shared/helpers/config';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent implements OnInit, OnChanges {
  @Input() styleClass?: string;
  @Input() defaultLang?: string;
  @Input() redirectOnChange = true;
  @Output() changeLang = new EventEmitter<string>();

  readonly languages = this.localeService.languages;
  current?: LanguageConfig

  constructor(
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    this.initCurrentLang();
  }

  ngOnChanges(): void {
    this.initCurrentLang();
  }

  languageChanged(lang: { value: { tag: string } }): void {
    this.changeLang.emit(lang.value.tag);

    if (this.redirectOnChange) {
      this.localeService.navigateTo(lang.value.tag);
    }
  }

  private initCurrentLang(): void {
    this.current = this.defaultLang ? this.languages.find(({ tag }) => tag === this.defaultLang) : this.localeService.currentLang;
  }

}
