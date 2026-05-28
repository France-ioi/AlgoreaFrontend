import { FormArray, FormControl } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { isStringsValueSubjectToValidation } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';

export function computeInvalidLanguageTags(
  allStrings: FormArray<FormControl<StringsValue>>,
  pendingDeletions: ReadonlySet<string>,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): ReadonlySet<string> {
  const tags = allStrings.controls
    .filter(c => {
      if (c.disabled) return false;
      const value = c.getRawValue();
      return isStringsValueSubjectToValidation(value, pendingDeletions, itemSupportedLanguageTags, loadedLanguageTags)
        && c.invalid;
    })
    .map(c => c.getRawValue().languageTag);
  return new Set(tags);
}

export function allStringsFormHasInvalidControl(
  allStrings: FormArray<FormControl<StringsValue>>,
  pendingDeletions: ReadonlySet<string>,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): boolean {
  return allStrings.controls.some(c => {
    if (c.disabled) return false;
    const value = c.getRawValue();
    return isStringsValueSubjectToValidation(value, pendingDeletions, itemSupportedLanguageTags, loadedLanguageTags)
      && c.invalid;
  });
}
