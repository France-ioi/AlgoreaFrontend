import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent implements OnChanges {
  @Output() changeLang = new EventEmitter<void>();
  @Input() defaultLang?: string;

  readonly languages = this.localeService.languages;
  current = this.languages?.find(l => l.tag === this.localeService.currentTag);

  constructor(
    private localeService: LocaleService,
  ) {}

  ngOnChanges(): void {
    if (this.defaultLang) {
      this.current = this.languages?.find(l => l.tag === this.defaultLang);
    }
  }

  languageChanged(lang: { value: { tag: string } }): void {
    this.localeService.navigateTo(lang.value.tag);
  }

}
