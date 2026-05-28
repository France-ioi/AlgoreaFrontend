import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { stringsValuesEqual } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';

export interface AllStringsFormValue {
  strings: StringsValue[],
  pendingDeletions: readonly string[],
}

export function normalizeAllStringsFormValue(
  value: AllStringsFormValue | StringsValue[] | null,
): AllStringsFormValue | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return { strings: value, pendingDeletions: [] };
  }
  return value;
}

export function allStringsFormValuesEqual(a: AllStringsFormValue, b: AllStringsFormValue): boolean {
  if (a.pendingDeletions.length !== b.pendingDeletions.length) return false;
  const pendingA = [ ...a.pendingDeletions ].sort().join(',');
  const pendingB = [ ...b.pendingDeletions ].sort().join(',');
  if (pendingA !== pendingB) return false;
  return stringsValuesEqual(a.strings, b.strings);
}

/** Drops locally-added tabs marked pending-deletion (not persisted on the server yet). */
export function applyLocalCommitToFormValue(
  value: AllStringsFormValue,
  serverSupportedLanguageTags: readonly string[],
): { value: AllStringsFormValue, changed: boolean } {
  const toRemove = new Set(
    value.pendingDeletions.filter(tag => !serverSupportedLanguageTags.includes(tag)),
  );
  if (toRemove.size === 0) return { value, changed: false };

  const strings = value.strings.filter(v => !toRemove.has(v.languageTag));
  const pendingDeletions = value.pendingDeletions.filter(tag => !toRemove.has(tag));
  return {
    value: { strings, pendingDeletions },
    changed: true,
  };
}

export function hasLocalOnlyPendingRemovals(
  value: AllStringsFormValue,
  serverSupportedLanguageTags: readonly string[],
): boolean {
  return value.pendingDeletions.some(tag => !serverSupportedLanguageTags.includes(tag));
}
