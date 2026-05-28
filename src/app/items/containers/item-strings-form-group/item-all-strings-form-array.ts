import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import {
  emptyStringsValue,
  stringsValueValidator,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';

export function findStringsControlByTag(
  allStrings: FormArray<FormControl<StringsValue>>,
  languageTag: string,
): FormControl<StringsValue> | undefined {
  return allStrings.controls.find(c => c.getRawValue().languageTag === languageTag);
}

export function moveDefaultStringsControlToFirst(
  allStrings: FormArray<FormControl<StringsValue>>,
  languageTag: string,
): void {
  const idx = allStrings.controls.findIndex(c => c.getRawValue().languageTag === languageTag);
  if (idx <= 0) return;
  const control = allStrings.at(idx);
  allStrings.removeAt(idx, { emitEvent: false });
  allStrings.insert(0, control, { emitEvent: false });
}

export function tabLanguageTagsFromFormArray(
  allStrings: FormArray<FormControl<StringsValue>>,
): string[] {
  return allStrings.controls.map(c => c.getRawValue().languageTag).filter(tag => tag !== '');
}

export function addStringsFormControl(
  fb: FormBuilder,
  allStrings: FormArray<FormControl<StringsValue>>,
  value?: Partial<StringsValue>,
  options: { emitEvent: boolean } = { emitEvent: value !== undefined },
): void {
  allStrings.push(
    fb.nonNullable.control<StringsValue>(emptyStringsValue(value), { validators: stringsValueValidator }),
    options,
  );
}
