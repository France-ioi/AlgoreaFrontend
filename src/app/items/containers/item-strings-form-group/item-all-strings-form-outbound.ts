import { FormArray, FormControl } from '@angular/forms';
import {
  AllStringsFormValue,
  allStringsFormValuesEqual,
} from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { filterOutboundStringsValues } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { createCvaEcho } from 'src/app/utils/cva-echo';

function cloneAllStringsFormValue(value: AllStringsFormValue): AllStringsFormValue {
  return {
    strings: value.strings.map(v => ({ ...v })),
    pendingDeletions: [ ...value.pendingDeletions ],
  };
}

export function createAllStringsFormEcho(): ReturnType<typeof createCvaEcho<AllStringsFormValue>> {
  return createCvaEcho(allStringsFormValuesEqual, cloneAllStringsFormValue);
}

export function buildAllStringsOutboundPayload(
  allStrings: FormArray<FormControl<StringsValue>>,
  pendingDeletions: ReadonlySet<string>,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): AllStringsFormValue {
  return {
    strings: filterOutboundStringsValues(
      allStrings.getRawValue(),
      pendingDeletions,
      itemSupportedLanguageTags,
      loadedLanguageTags,
    ),
    pendingDeletions: [ ...pendingDeletions ],
  };
}
