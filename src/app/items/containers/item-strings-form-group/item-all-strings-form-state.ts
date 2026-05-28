import { computed, Signal } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import {
  ItemStringsFormState,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { computeInvalidLanguageTags } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-validation';

export function createItemStringsFormStateComputed(
  platformLanguageCount: number,
  deps: {
    showDescription: Signal<boolean>,
    defaultLanguageTag: Signal<string | undefined>,
    itemSupportedLanguageTags: Signal<string[]>,
    stringsControlCount: Signal<number>,
    forceTabs: Signal<boolean>,
    supportedLanguages: Signal<string[]>,
    tabLanguageTags: Signal<string[]>,
  },
): {
  state: Signal<ItemStringsFormState>,
  missingLanguages: Signal<string[]>,
  sectionHeading: Signal<string>,
  showTranslateCta: Signal<boolean>,
  resolvedLanguageTag: Signal<string>,
} {
  const state = computed((): ItemStringsFormState => {
    if (platformLanguageCount === 1) return 'mono';
    if (
      deps.itemSupportedLanguageTags().length > 1
      || deps.stringsControlCount() > 1
      || deps.forceTabs()
    ) return 'tabs';
    return 'single';
  });

  const missingLanguages = computed(() => {
    const currentTags = new Set(deps.tabLanguageTags());
    return deps.supportedLanguages().filter(tag => !currentTags.has(tag));
  });

  const sectionHeading = computed((): string => (
    deps.showDescription() ? $localize`Header & Description` : $localize`Header`
  ));
  const showTranslateCta = computed(() => state() === 'single');
  const resolvedLanguageTag = computed(
    () => deps.defaultLanguageTag() || deps.supportedLanguages()[0] || '',
  );

  return { state, missingLanguages, sectionHeading, showTranslateCta, resolvedLanguageTag };
}

export function createInvalidLanguageTagsComputed(
  deps: {
    formArrayRevision: Signal<unknown>,
    allStrings: FormArray<FormControl<StringsValue>>,
    pendingDeletions: Signal<ReadonlySet<string>>,
    itemSupportedLanguageTags: Signal<string[]>,
    loadedLanguageTags: Signal<string[]>,
  },
): Signal<ReadonlySet<string>> {
  return computed(() => {
    deps.formArrayRevision();
    return computeInvalidLanguageTags(
      deps.allStrings,
      deps.pendingDeletions(),
      deps.itemSupportedLanguageTags(),
      deps.loadedLanguageTags(),
    );
  });
}
