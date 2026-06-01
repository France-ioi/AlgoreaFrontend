import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ItemStringsControlComponent,
  StringsValue,
} from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { formatLanguageTagDisplay } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';

@Component({
  selector: 'alg-item-strings-tabs',
  templateUrl: './item-strings-tabs.component.html',
  styleUrls: [ './item-strings-tabs.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ItemStringsControlComponent,
    ButtonComponent,
    LoadingComponent,
  ],
})
export class ItemStringsTabsComponent {
  readonly tablistAriaLabel = $localize`Translations`;
  readonly translationActionsLabel = $localize`Translation management`;
  private readonly tabErrorAriaSuffix = $localize`has validation errors`;

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  languageTags = input.required<string[]>();
  defaultLanguageTag = input.required<string>();
  activeLanguageTag = input.required<string>();
  pendingDeletions = input.required<ReadonlySet<string>>();
  loadingLanguages = input.required<ReadonlySet<string>>();
  failedLanguages = input<ReadonlySet<string>>(new Set());
  missingLanguages = input.required<string[]>();
  invalidLanguageTags = input<ReadonlySet<string>>(new Set());
  showDescription = input(false);
  activeControl = input<FormControl<StringsValue>>();

  activeTabChange = output<string>();
  setDefaultLanguage = output<string>();
  togglePendingDeletion = output<string>();
  addLanguage = output<string>();
  retryFetch = output<string>();

  tabId(tag: string): string {
    return `lang-tab-${tag}`;
  }

  panelId(tag: string): string {
    return `lang-panel-${tag}`;
  }

  tabLabel(tag: string): string {
    const display = formatLanguageTagDisplay(tag);
    if (tag === this.defaultLanguageTag()) {
      return `${display} ${$localize`(default)`}`;
    }
    return display;
  }

  addLanguageTabLabel(languageTag: string): string {
    return $localize`+ add ${formatLanguageTagDisplay(languageTag)}:languageTag:`;
  }

  addLanguageTabAriaLabel(languageTag: string): string {
    return $localize`Add ${formatLanguageTagDisplay(languageTag)}:languageTag: translation:`;
  }

  removeTranslationLabelFor(languageTag: string): string {
    return $localize`Remove the ${formatLanguageTagDisplay(languageTag)}:languageTag: translation`;
  }

  setDefaultLanguageLabel(languageTag: string): string {
    return $localize`Set ${formatLanguageTagDisplay(languageTag)}:languageTag: as the default language`;
  }

  isDefault(tag: string): boolean {
    return tag === this.defaultLanguageTag();
  }

  isPendingDeletion(tag: string): boolean {
    return this.pendingDeletions().has(tag);
  }

  isLoading(tag: string): boolean {
    return this.loadingLanguages().has(tag);
  }

  hasFetchError(tag: string): boolean {
    return this.failedLanguages().has(tag);
  }

  hasError(tag: string): boolean {
    return !this.isPendingDeletion(tag) && this.invalidLanguageTags().has(tag);
  }

  tabAriaLabel(tag: string): string {
    const label = this.tabLabel(tag);
    return this.hasError(tag) ? `${label} (${this.tabErrorAriaSuffix})` : label;
  }

  selectTab(tag: string): void {
    this.activeTabChange.emit(tag);
  }

  onDeleteClick(event: MouseEvent, languageTag: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.togglePendingDeletion.emit(languageTag);
  }

  onTablistKeydown(event: KeyboardEvent): void {
    const tags = this.languageTags();
    if (tags.length === 0) return;

    const currentIdx = tags.indexOf(this.activeLanguageTag());
    const startIdx = currentIdx >= 0 ? currentIdx : 0;
    let nextIdx: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIdx = (startIdx + 1) % tags.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIdx = (startIdx - 1 + tags.length) % tags.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = tags.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTag = tags[nextIdx];
    if (!nextTag) return;
    this.selectTab(nextTag);
    queueMicrotask(() => this.tabButtons()[nextIdx]?.nativeElement.focus());
  }
}
