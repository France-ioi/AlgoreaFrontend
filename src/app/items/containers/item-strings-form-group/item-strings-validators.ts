import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';

export const stringsLanguageTagValidators = [ Validators.required ];
export const stringsTitleValidators = [ Validators.required, Validators.minLength(3) ];
export const stringsSubtitleValidators = [ Validators.maxLength(200) ];

/**
 * Current frontend character limit for item descriptions (easy to change in one place).
 * Character-based via JS `String.length` / Angular `Validators.maxLength` — not a byte limit,
 * and not guaranteed to match the production backend/DB limit exactly.
 */
export const ITEM_DESCRIPTION_MAX_LENGTH = 100_000;
export const stringsDescriptionValidators = [ Validators.maxLength(ITEM_DESCRIPTION_MAX_LENGTH) ];

export function stringsValueValidationErrors(value: StringsValue | null | undefined): ValidationErrors | null {
  if (!value?.languageTag) return { stringsValue: true };
  if (!value.title || value.title.length < 3) return { stringsValue: true };
  if (value.subtitle.length > 200) return { stringsValue: true };
  if (value.description.length > ITEM_DESCRIPTION_MAX_LENGTH) return { stringsValue: true };
  return null;
}

/** Validates aggregated `StringsValue` objects on inactive tabs in the parent form array. */
export const stringsValueValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  stringsValueValidationErrors(control.value as StringsValue | null | undefined);
