import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';

export const stringsLanguageTagValidators = [ Validators.required ];
export const stringsTitleValidators = [ Validators.required, Validators.minLength(3) ];
export const stringsSubtitleValidators = [ Validators.maxLength(200) ];

export function stringsValueValidationErrors(value: StringsValue | null | undefined): ValidationErrors | null {
  if (!value?.languageTag) return { stringsValue: true };
  if (!value.title || value.title.length < 3) return { stringsValue: true };
  if (value.subtitle.length > 200) return { stringsValue: true };
  return null;
}

/** Validates aggregated `StringsValue` objects on inactive tabs in the parent form array. */
export const stringsValueValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  stringsValueValidationErrors(control.value as StringsValue | null | undefined);
