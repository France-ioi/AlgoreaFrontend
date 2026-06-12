import { Component, inject, input, linkedSignal, output } from '@angular/core';
import { LocaleService } from '../../services/localeService';
import { FormsModule } from '@angular/forms';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { SelectComponent } from 'src/app/ui-components/select/select.component';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ],
  imports: [ FormsModule, SelectComponent, SelectOptionComponent ]
})
export class LanguagePickerComponent {
  private localeService = inject(LocaleService);

  defaultLang = input<string>();
  redirectOnChange = input(true);
  changeLang = output<string>();

  readonly languages = this.localeService.languages.map(({ tag }) => ({ label: tag, value: tag }));
  // linkedSignal (not computed): recomputes when defaultLang() changes so platform-settings can
  // pre-select the user's default language, while user picks via ngModel still persist until then.
  current = linkedSignal(() => this.defaultLang() ?? this.localeService.currentLang?.tag);

  languageChanged(lang: { value: string }): void {
    this.changeLang.emit(lang.value);

    if (this.redirectOnChange()) {
      this.localeService.navigateTo(lang.value);
    }
  }

}
