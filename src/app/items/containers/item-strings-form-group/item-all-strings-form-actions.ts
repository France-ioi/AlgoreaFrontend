import { WritableSignal } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import {
  addStringsFormControl,
  findStringsControlByTag,
  moveDefaultStringsControlToFirst,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-array';
import { ItemStringsLanguageLoader } from 'src/app/items/containers/item-strings-form-group/item-strings-language-loader';

export interface TogglePendingDeletionContext {
  allStrings: FormArray<FormControl<StringsValue>>,
  pendingDeletions: WritableSignal<ReadonlySet<string>>,
  emitOutboundValue: () => void,
  scheduleRevalidation: () => void,
}

export function toggleStringsPendingDeletion(
  ctx: TogglePendingDeletionContext,
  languageTag: string,
): void {
  const control = findStringsControlByTag(ctx.allStrings, languageTag);
  if (!control) return;

  ctx.pendingDeletions.update(set => {
    const next = new Set(set);
    if (next.has(languageTag)) {
      next.delete(languageTag);
      control.enable({ emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    } else {
      next.add(languageTag);
      control.disable({ emitEvent: false });
    }
    return next;
  });
  ctx.emitOutboundValue();
  ctx.scheduleRevalidation();
}

export interface AddLanguageContext {
  fb: FormBuilder,
  allStrings: FormArray<FormControl<StringsValue>>,
  activeLanguageTag: WritableSignal<string>,
  syncFormArrayState: () => void,
  emitOutboundValue: () => void,
  scheduleRevalidation: () => void,
}

export function addStringsLanguageTab(ctx: AddLanguageContext, languageTag: string): void {
  if (findStringsControlByTag(ctx.allStrings, languageTag)) return;
  addStringsFormControl(ctx.fb, ctx.allStrings, { languageTag });
  ctx.activeLanguageTag.set(languageTag);
  ctx.syncFormArrayState();
  ctx.emitOutboundValue();
  ctx.scheduleRevalidation();
}

export interface FetchLanguageContext {
  itemId: string | undefined,
  allStrings: FormArray<FormControl<StringsValue>>,
  languageLoader: ItemStringsLanguageLoader,
  loadedLanguageTags: () => string[],
  itemSupportedLanguageTags: () => string[],
  onLoaded: (value: StringsValue) => void,
  scheduleRevalidation: () => void,
}

export function fetchStringsLanguageIfNeeded(ctx: FetchLanguageContext, languageTag: string): void {
  const itemId = ctx.itemId;
  if (!itemId) return;

  const control = findStringsControlByTag(ctx.allStrings, languageTag);
  if (!control) return;

  ctx.languageLoader.fetchIfNeeded({
    itemId,
    languageTag,
    control,
    isLoaded: tag => ctx.loadedLanguageTags().includes(tag),
    isOnServer: tag => ctx.itemSupportedLanguageTags().includes(tag),
    onLoaded: value => ctx.onLoaded(value),
    onSettled: () => ctx.scheduleRevalidation(),
  });
}

export function setDefaultStringsLanguage(
  allStrings: FormArray<FormControl<StringsValue>>,
  languageTag: string,
  activeLanguageTag: WritableSignal<string>,
  syncFormArrayState: () => void,
  emitOutboundValue: () => void,
): void {
  moveDefaultStringsControlToFirst(allStrings, languageTag);
  activeLanguageTag.set(languageTag);
  syncFormArrayState();
  emitOutboundValue();
}
