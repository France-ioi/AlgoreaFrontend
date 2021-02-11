import { Component } from '@angular/core';
import { SelectItemType } from 'src/app/modules/shared-components/components/select/select.component';
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

  languageOptions: SelectItemType[] = [];
  current?: string;

  constructor(
    private localeService: LocaleService,
  ) {
    if (this.localeService.languages) {
      this.languageOptions = this.localeService.languages.filter(l => !!languagesAsText[l.tag]).map(l => ({
        text: languagesAsText[l.tag],
        value: l.tag
      }));
    }

    if (this.localeService.currentTag) this.current = languagesAsText[this.localeService.currentTag];
  }

  languageChanged(langTag: string): void {
    this.localeService.navigateTo(langTag);
  }

}
