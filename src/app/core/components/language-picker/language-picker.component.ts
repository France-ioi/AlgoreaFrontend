import { Component } from '@angular/core';
import { LocaleService } from '../../services/localeService';

const languagesAsText: { [lang: string]: string } = {
  fr: 'Français',
  en: 'English',
};

function tagForLabel(label: string): string {
  for (const key in languagesAsText) {
    if (languagesAsText[key] === label) return key;
  }
  throw new Error('Unexpected: unknown language selected');
}

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent {

  readonly languageLabels = this.localeService.languages?.map(l => languagesAsText[l.tag]).filter(l => !!l);
  current?: string;

  constructor(
    private localeService: LocaleService,
  ) {
    if (this.localeService.currentTag) this.current = languagesAsText[this.localeService.currentTag];
  }

  languageChanged(langLabel: string): void {
    this.localeService.navigateTo(tagForLabel(langLabel));
  }

}
