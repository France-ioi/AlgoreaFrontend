import { Component } from '@angular/core';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent {

  readonly languages = this.localeService.languages;
  readonly current = this.languages?.find(l => l.tag === this.localeService.currentTag);

  constructor(
    private localeService: LocaleService,
  ) {}

  languageChanged(lang: { value: { tag: string } }): void {
    this.localeService.navigateTo(lang.value.tag);
  }

}
