import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { CurrentUserHttpService } from 'src/app/shared/http-services/current-user.service';
import { LocaleService } from '../../../../core/services/localeService';

@Component({
  selector: 'alg-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: [ './language-picker.component.scss' ]
})
export class LanguagePickerComponent implements OnChanges {
  @Input() styleClass?: string;
  @Input() defaultLang?: string;
  @Output() languageChanged = new EventEmitter<string>();
  @Output() languageChangeError = new EventEmitter<void>();

  readonly languages = this.localeService.languages;
  current = this.languages?.find(l => l.tag === this.localeService.currentTag);
  disabled = false

  constructor(
    private localeService: LocaleService,
    private currentUserService: CurrentUserHttpService,
  ) {}

  ngOnChanges(): void {
    if (this.defaultLang) {
      this.current = this.languages?.find(l => l.tag === this.defaultLang);
    }
  }

  changeLanguage(lang: { value: { tag: string } }): void {
    this.disabled = true;
    this.currentUserService.update({ default_language: lang.value.tag }).subscribe({
      error: () => {
        this.disabled = false;
        this.languageChangeError.emit();
      },
      complete: () => {
        this.disabled = false;
        this.languageChanged.emit(lang.value.tag);
        this.localeService.navigateTo(lang.value.tag);
      }
    });

  }

}
