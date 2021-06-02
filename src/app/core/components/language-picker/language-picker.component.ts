import { Component, Input, OnChanges, Output, EventEmitter, OnInit } from '@angular/core';
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

  readonly languages = this.localeService.languages.map(({ tag }) => ({ label: tag, value: tag }));
  current?: string;

  constructor(
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    this.initCurrentLang();
  }

  ngOnChanges(): void {
    this.initCurrentLang();
  }

  languageChanged(lang: { value: string }): void {
    this.changeLang.emit(lang.value);

    if (this.redirectOnChange) {
      this.localeService.navigateTo(lang.value);
    }
  }

  private initCurrentLang(): void {
    this.current = this.defaultLang ?? this.localeService.currentLang?.tag;
  }

}
