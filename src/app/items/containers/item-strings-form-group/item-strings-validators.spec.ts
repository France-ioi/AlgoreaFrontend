import { FormControl } from '@angular/forms';
import {
  ITEM_DESCRIPTION_MAX_LENGTH,
  stringsDescriptionValidators,
  stringsValueValidationErrors,
} from './item-strings-validators';
import { StringsValue } from './item-strings-control/item-strings-control.component';

function validStrings(overrides: Partial<StringsValue> = {}): StringsValue {
  return {
    languageTag: 'en',
    title: 'Valid title',
    subtitle: '',
    description: '',
    ...overrides,
  };
}

describe('item-strings-validators', () => {
  describe('ITEM_DESCRIPTION_MAX_LENGTH', () => {
    it('should be 100000', () => {
      expect(ITEM_DESCRIPTION_MAX_LENGTH).toBe(100_000);
    });
  });

  describe('stringsDescriptionValidators', () => {
    it('should accept a description at the max length', () => {
      const control = new FormControl('a'.repeat(ITEM_DESCRIPTION_MAX_LENGTH), stringsDescriptionValidators);
      expect(control.valid).toBeTrue();
    });

    it('should reject a description longer than the max length', () => {
      const control = new FormControl('a'.repeat(ITEM_DESCRIPTION_MAX_LENGTH + 1), stringsDescriptionValidators);
      expect(control.hasError('maxlength')).toBeTrue();
      expect(control.getError('maxlength').requiredLength).toBe(ITEM_DESCRIPTION_MAX_LENGTH);
    });
  });

  describe('stringsValueValidationErrors', () => {
    it('should accept a description at the max length', () => {
      expect(stringsValueValidationErrors(validStrings({
        description: 'a'.repeat(ITEM_DESCRIPTION_MAX_LENGTH),
      }))).toBeNull();
    });

    it('should reject a description longer than the max length', () => {
      expect(stringsValueValidationErrors(validStrings({
        description: 'a'.repeat(ITEM_DESCRIPTION_MAX_LENGTH + 1),
      }))).toEqual({ stringsValue: true });
    });
  });
});
