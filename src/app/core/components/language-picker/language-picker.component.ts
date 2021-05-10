import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent implements OnChanges {
  @Output() changeLang = new EventEmitter<string>();
  @Input() defaultLang?: string;
  @Input() autoRefresh = true;

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
    this.changeLang.emit(lang.value.tag);

    if (this.autoRefresh) {
      this.localeService.navigateTo(lang.value.tag);
    }
  }

}
