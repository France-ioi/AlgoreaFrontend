import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  ItemStringsControlComponent,
  StringsValue,
} from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { APPCONFIG } from 'src/app/config';
import { ItemStringsTabsComponent } from 'src/app/items/containers/item-strings-form-group/item-strings-tabs/item-strings-tabs.component';
import {
  emptyStringsValue,
  stringsValueValidator,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { applyHostedAllStringsWriteValue } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-write-value';
import {
  AllStringsFormValue,
  normalizeAllStringsFormValue,
} from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { ItemStringsLanguageLoader } from 'src/app/items/containers/item-strings-form-group/item-strings-language-loader';
import { tabLanguageTagsFromFormArray } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-array';
import {
  addStringsLanguageTab,
  fetchStringsLanguageIfNeeded,
  setDefaultStringsLanguage,
  toggleStringsPendingDeletion,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-actions';
import { allStringsFormHasInvalidControl } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-validation';
import {
  createInvalidLanguageTagsComputed,
  createItemStringsFormStateComputed,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-state';
import {
  buildAllStringsOutboundPayload,
  createAllStringsFormEcho,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-outbound';
import { merge, startWith } from 'rxjs';

@Component({
  selector: 'alg-item-all-strings-form',
  templateUrl: './item-all-strings-form.component.html',
  styleUrls: [ './item-all-strings-form.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemStringsControlComponent,
    ItemStringsTabsComponent,
    ReactiveFormsModule,
    ButtonComponent,
  ],
  providers: [
    ItemStringsLanguageLoader,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemAllStringsFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemAllStringsFormComponent),
      multi: true,
    },
  ],
})
export class ItemAllStringsFormComponent implements Validator {
  defaultLanguageEvent = output<string>();
  languageValueLoaded = output<StringsValue>();

  defaultLanguageTag = input<string>();
  supportedLanguages = input.required<string[]>();
  showDescription = input(false);
  itemId = input<string>();
  itemSupportedLanguageTags = input<string[]>([]);
  loadedLanguageTags = input<string[]>([]);

  private fb = inject(FormBuilder);
  private config = inject(APPCONFIG);
  private languageLoader = inject(ItemStringsLanguageLoader);
  private outboundEcho = createAllStringsFormEcho();
  private pendingRevalidationTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressOutboundEmit = false;

  private timerCleanup = inject(DestroyRef).onDestroy(() => {
    if (this.pendingRevalidationTimer !== undefined) clearTimeout(this.pendingRevalidationTimer);
    this.languageLoader.clear();
  });

  readonly loadingLanguages = this.languageLoader.loadingLanguages;
  readonly failedLanguages = this.languageLoader.failedLanguages;

  form = this.fb.group({
    allStrings: this.fb.nonNullable.array([
      this.fb.nonNullable.control<StringsValue>(emptyStringsValue(), { validators: stringsValueValidator }),
    ]),
  });

  forceTabs = signal(false);
  pendingDeletions = signal<ReadonlySet<string>>(new Set());
  activeLanguageTag = signal('');
  stringsControlCount = signal(1);
  tabLanguageTags = signal<string[]>([]);

  private readonly formArrayRevision = toSignal(
    merge(
      this.form.controls.allStrings.valueChanges,
      this.form.controls.allStrings.statusChanges,
    ).pipe(startWith(null)),
    { initialValue: null },
  );

  private readonly formState = createItemStringsFormStateComputed(this.config.languages.length, {
    showDescription: this.showDescription,
    defaultLanguageTag: this.defaultLanguageTag,
    itemSupportedLanguageTags: this.itemSupportedLanguageTags,
    stringsControlCount: this.stringsControlCount,
    forceTabs: this.forceTabs,
    supportedLanguages: this.supportedLanguages,
    tabLanguageTags: this.tabLanguageTags,
  });
  readonly state = this.formState.state;
  readonly missingLanguages = this.formState.missingLanguages;
  readonly sectionHeading = this.formState.sectionHeading;
  readonly showTranslateCta = this.formState.showTranslateCta;
  readonly resolvedLanguageTag = this.formState.resolvedLanguageTag;
  activeStringsControl = computed((): FormControl<StringsValue> | undefined => {
    const tag = this.activeLanguageTag();
    if (!tag) return undefined;
    return this.allStrings.controls.find(c => c.getRawValue().languageTag === tag);
  });

  readonly invalidLanguageTags = createInvalidLanguageTagsComputed({
    formArrayRevision: this.formArrayRevision,
    allStrings: this.allStrings,
    pendingDeletions: this.pendingDeletions,
    itemSupportedLanguageTags: this.itemSupportedLanguageTags,
    loadedLanguageTags: this.loadedLanguageTags,
  });

  private valueChangesSub = this.form.controls.allStrings.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      this.syncFormArrayState();
      this.emitOutboundValue();
    });

  get allStrings(): FormArray<FormControl<StringsValue>> {
    return this.form.controls.allStrings;
  }

  writeValue(value: AllStringsFormValue | StringsValue[] | null): void {
    const normalized = normalizeAllStringsFormValue(value);
    if (!normalized) return;

    this.suppressOutboundEmit = true;
    try {
      applyHostedAllStringsWriteValue({
        fb: this.fb,
        form: this.form,
        languageLoader: this.languageLoader,
        outboundEcho: this.outboundEcho,
        itemSupportedLanguageTags: this.itemSupportedLanguageTags(),
        defaultLanguageTag: this.defaultLanguageTag(),
        resolvedLanguageTag: this.resolvedLanguageTag(),
        pendingDeletions: this.pendingDeletions,
        forceTabs: this.forceTabs,
        activeLanguageTag: this.activeLanguageTag,
        syncFormArrayState: () => this.syncFormArrayState(),
        buildOutboundPayload: () => this.buildOutboundPayload(),
        fetchLanguageIfNeeded: tag => this.fetchLanguageIfNeeded(tag),
      }, normalized);
    } finally {
      this.suppressOutboundEmit = false;
    }
  }

  validate(): ValidationErrors | null {
    return allStringsFormHasInvalidControl(
      this.allStrings, this.pendingDeletions(), this.itemSupportedLanguageTags(), this.loadedLanguageTags(),
    ) ? { allStringsForm: true } : null;
  }

  private onChange: (value: AllStringsFormValue | null) => void = () => {};
  private onValidatorChange: () => void = () => {};
  registerOnChange(fn: (value: AllStringsFormValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: AllStringsFormValue | null) => void): void { /* no-op */ }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  onShowTabs(): void {
    this.forceTabs.set(true);
    const defaultTag = this.defaultLanguageTag() ?? this.allStrings.at(0)?.getRawValue().languageTag ?? '';
    this.activeLanguageTag.set(defaultTag);
    if (defaultTag) {
      this.fetchLanguageIfNeeded(defaultTag);
    }
  }

  onActiveTabChange(tag: string): void {
    this.activeLanguageTag.set(tag);
    this.fetchLanguageIfNeeded(tag);
  }

  onRetryFetch(languageTag: string): void {
    this.languageLoader.retry(languageTag);
  }

  onSetDefaultLanguage(languageTag: string): void {
    this.defaultLanguageEvent.emit(languageTag);
    setDefaultStringsLanguage(
      this.allStrings,
      languageTag,
      this.activeLanguageTag,
      () => this.syncFormArrayState(),
      () => this.emitOutboundValue(),
    );
  }

  onTogglePendingDeletion(languageTag: string): void {
    toggleStringsPendingDeletion({
      allStrings: this.allStrings,
      pendingDeletions: this.pendingDeletions,
      emitOutboundValue: () => this.emitOutboundValue(),
      scheduleRevalidation: () => this.scheduleRevalidation(),
    }, languageTag);
  }

  onAddLanguage(languageTag: string): void {
    addStringsLanguageTab({
      fb: this.fb,
      allStrings: this.allStrings,
      activeLanguageTag: this.activeLanguageTag,
      syncFormArrayState: () => this.syncFormArrayState(),
      emitOutboundValue: () => this.emitOutboundValue(),
      scheduleRevalidation: () => this.scheduleRevalidation(),
    }, languageTag);
  }

  private fetchLanguageIfNeeded(languageTag: string): void {
    fetchStringsLanguageIfNeeded({
      itemId: this.itemId(),
      allStrings: this.allStrings,
      languageLoader: this.languageLoader,
      loadedLanguageTags: () => this.loadedLanguageTags(),
      itemSupportedLanguageTags: () => this.itemSupportedLanguageTags(),
      onLoaded: value => this.languageValueLoaded.emit(value),
      scheduleRevalidation: () => this.scheduleRevalidation(),
    }, languageTag);
  }

  private scheduleRevalidation(): void {
    if (this.pendingRevalidationTimer !== undefined) clearTimeout(this.pendingRevalidationTimer);
    this.pendingRevalidationTimer = setTimeout(() => {
      this.pendingRevalidationTimer = undefined;
      this.onValidatorChange();
    });
  }

  private syncFormArrayState(): void {
    this.stringsControlCount.set(this.allStrings.length);
    this.tabLanguageTags.set(tabLanguageTagsFromFormArray(this.allStrings));
  }

  private buildOutboundPayload(): AllStringsFormValue {
    return buildAllStringsOutboundPayload(
      this.allStrings,
      this.pendingDeletions(),
      this.itemSupportedLanguageTags(),
      this.loadedLanguageTags(),
    );
  }

  private emitOutboundValue(): void {
    if (this.suppressOutboundEmit) return;
    const value = this.buildOutboundPayload();
    if (value.strings.length === 0 && value.pendingDeletions.length === 0) return;
    this.outboundEcho.emitIfChanged(value, v => this.onChange(v));
  }
}
