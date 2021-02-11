import { Component } from '@angular/core';
import { LocaleService } from '../../services/localeService';

const languagesAsText: { [lang: string]: string } = {
  fr: 'Français',
  en: 'English',
};

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent {

  readonly languageOptions = this.localeService.languages?.map(l => {
    const languageAsText = languagesAsText[l.tag];
    if(!languageAsText) return null;
    return {
      text: languageAsText,
      value: l.tag
    }
  }).filter(l => !!l);
  current?: string;

  constructor(
    private localeService: LocaleService,
  ) {
    if (this.localeService.currentTag) this.current = languagesAsText[this.localeService.currentTag];
  }

  languageChanged(langTag: string): void {
    this.localeService.navigateTo(langTag);
  }

}
