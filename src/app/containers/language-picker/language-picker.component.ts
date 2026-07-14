import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { SelectComponent } from 'src/app/ui-components/select/select.component';
import { SelectTriggerDirective } from 'src/app/ui-components/select/select-trigger.directive';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrl: './language-picker.component.scss',
  imports: [ FormsModule, SelectComponent, SelectOptionComponent, SelectTriggerDirective, UpperCasePipe ]
})
export class LanguagePickerComponent {
  private localeService = inject(LocaleService);

  defaultLang = input<string>();
  openAbove = input(false);
  redirectOnChange = input(true);
  variant = input<'labeled' | 'compact'>('labeled');
  changeLang = output<string>();

  readonly languages = this.localeService.languages.map(({ tag }) => ({ label: tag, value: tag }));
  // linkedSignal (not computed): recomputes when defaultLang() changes so platform-settings can
  // pre-select the user's default language, while user picks via ngModel still persist until then.
  current = linkedSignal(() => this.defaultLang() ?? this.localeService.currentLang?.tag);
  currentLanguageName = computed((): string => {
    const tag = this.current();
    if (!tag) {
      return '';
    }
    return new Intl.DisplayNames([ tag ], { type: 'language' }).of(tag) ?? tag.toUpperCase();
  });
  triggerAriaLabel = computed((): string =>
    $localize`:@@languagePicker.changeLanguage:Change language, current: ${this.currentLanguageName()}:currentLanguage:`
  );

  languageChanged(lang: { value: string }): void {
    this.changeLang.emit(lang.value);

    if (this.redirectOnChange()) {
      this.localeService.navigateTo(lang.value);
    }
  }

}
