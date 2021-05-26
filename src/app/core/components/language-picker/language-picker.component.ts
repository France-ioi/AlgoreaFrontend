import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent implements OnChanges {
  @Input() styleClass?: string;
  @Input() defaultLang?: string;
  @Input() redirectOnChange = true;
  @Output() changeLang = new EventEmitter<string>();

  readonly languages = this.localeService.languages;
  current = this.localeService.currentLang;

  constructor(
    private localeService: LocaleService,
  ) {}

  ngOnChanges(): void {
    if (this.defaultLang) {
      this.current = this.languages.find(l => l.tag === this.defaultLang);
    }
  }

  languageChanged(lang: { value: { tag: string } }): void {
    this.changeLang.emit(lang.value.tag);

    if (this.redirectOnChange) {
      this.localeService.navigateTo(lang.value.tag);
    }
  }

}
