import { Component } from '@angular/core';
import { LocaleService } from '../../services/localeService';

interface Language { tag: string, path: string }

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent {

  readonly languageLabels = this.localeService.languages;
  current?: { tag: string, path: string };

  constructor(
    private localeService: LocaleService,
  ) {
    if (this.localeService.currentTag) this.current = this.languageLabels?.find(l => l.tag === this.localeService.currentTag);
  }

  languageChanged(lang: { value: Language }): void {
    this.localeService.navigateTo(lang.value.tag);
  }

}
