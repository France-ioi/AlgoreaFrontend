import { Item } from 'src/app/data-access/get-item-by-id.service';
import { AllStringsFormValue } from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { itemToStringsValue } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import {
  ItemParametersValue,
  itemToParametersValue,
} from 'src/app/items/models/item-parameters';
import { commitLocalStringsFormValue } from './item-edit-wrapper-save';

export interface ItemEditAllStringsControl {
  getRawValue(): AllStringsFormValue,
  setValue(value: AllStringsFormValue, options?: { emitEvent?: boolean }): void,
}

export interface ItemEditForms {
  itemForm: {
    reset(value: unknown, options?: { emitEvent?: boolean }): void,
    markAsPristine(): void,
    controls: { allStrings: ItemEditAllStringsControl },
  },
  imageUrlForm: {
    reset(value: unknown, options?: { emitEvent?: boolean }): void,
    markAsPristine(): void,
  },
}

export interface ItemEditFormSnapshot {
  initialItem: Item,
  initialParameters: ItemParametersValue,
  initialLanguageValues: StringsValue[],
}

export function createItemEditSnapshot(item: Item): ItemEditFormSnapshot {
  return {
    initialItem: item,
    initialParameters: itemToParametersValue(item),
    initialLanguageValues: [ itemToStringsValue(item) ],
  };
}

export function resetItemEditForms(
  forms: ItemEditForms,
  snapshot: ItemEditFormSnapshot,
): void {
  forms.itemForm.reset({
    defaultLanguageTag: snapshot.initialItem.defaultLanguageTag,
    parameters: snapshot.initialParameters,
    allStrings: {
      strings: snapshot.initialLanguageValues,
      pendingDeletions: [],
    },
  }, { emitEvent: false });
  resetImageUrlForm(forms.imageUrlForm, snapshot);
}

export function resetImageUrlForm(
  imageUrlForm: ItemEditForms['imageUrlForm'],
  snapshot: ItemEditFormSnapshot,
): void {
  const imageUrl = snapshot.initialLanguageValues
    .find(l => l.languageTag === snapshot.initialItem.defaultLanguageTag)?.imageUrl;
  imageUrlForm.reset({ imageUrl: imageUrl || '' }, { emitEvent: false });
}

export function syncFormStateAfterSave(
  forms: ItemEditForms,
  serverSupportedLanguageTags: readonly string[],
  setInitialLanguageValues: (values: StringsValue[]) => void,
): void {
  const allStringsControl = forms.itemForm.controls.allStrings;
  const next = commitLocalStringsFormValue(
    allStringsControl.getRawValue(),
    serverSupportedLanguageTags,
  );
  if (next) {
    allStringsControl.setValue(next, { emitEvent: false });
  }
  setInitialLanguageValues(allStringsControl.getRawValue().strings);
  forms.itemForm.markAsPristine();
  forms.imageUrlForm.markAsPristine();
}
