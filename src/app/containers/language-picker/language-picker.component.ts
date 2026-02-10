import { Component, Input, OnChanges, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { LocaleService } from '../../services/localeService';
import { FormsModule } from '@angular/forms';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { SelectComponent } from 'src/app/ui-components/select/select.component';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ],
  imports: [ FormsModule, SelectComponent, SelectOptionComponent, SelectOptionComponent ]
})
export class LanguagePickerComponent implements OnInit, OnChanges {
  private localeService = inject(LocaleService);

  @Input() defaultLang?: string;
  @Input() redirectOnChange = true;
  @Output() changeLang = new EventEmitter<string>();

  readonly languages = this.localeService.languages.map(({ tag }) => ({ label: tag, value: tag }));
  current?: string;

  ngOnInit(): void {
    this.initCurrentLang();
  }

  ngOnChanges(): void {
    this.initCurrentLang();
  }

  languageChanged(lang: { value: string }): void {
    this.changeLang.emit(lang.value);

    if (this.redirectOnChange) {
      this.localeService.navigateTo(lang.value);
    }
  }

  private initCurrentLang(): void {
    this.current = this.defaultLang ?? this.localeService.currentLang?.tag;
  }

}
