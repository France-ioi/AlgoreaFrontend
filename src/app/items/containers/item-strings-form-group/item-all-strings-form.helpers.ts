import { Item } from 'src/app/data-access/get-item-by-id.service';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { shallowEqual } from 'src/app/utils/shallow-equal';
import { stringsValueValidator } from 'src/app/items/containers/item-strings-form-group/item-strings-validators';

export { stringsValueValidator };

export type ItemStringsFormState = 'mono' | 'single' | 'tabs';

export function formatLanguageTagDisplay(languageTag: string): string {
  return languageTag.toUpperCase();
}

const STRINGS_VALUE_KEYS = [
  'languageTag',
  'title',
  'subtitle',
  'description',
] as const satisfies readonly (keyof StringsValue)[];

export function stringsValueEqual(a: StringsValue, b: StringsValue): boolean {
  return shallowEqual(a, b, STRINGS_VALUE_KEYS);
}

export function stringsValuesEqual(a: StringsValue[], b: StringsValue[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => {
    const other = b[index];
    return other !== undefined && stringsValueEqual(value, other);
  });
}

export function emptyStringsValue(overrides: Partial<StringsValue> = {}): StringsValue {
  return {
    languageTag: '',
    title: '',
    subtitle: '',
    description: '',
    ...overrides,
  };
}

export function expandWithMissingLanguagePlaceholders(
  values: StringsValue[],
  supportedTags: string[],
): StringsValue[] {
  const result = [ ...values ];
  for (const languageTag of supportedTags) {
    if (!result.some(v => v.languageTag === languageTag)) {
      result.push(emptyStringsValue({ languageTag }));
    }
  }
  return result;
}

export function sortStringsValuesWithDefaultFirst(
  values: StringsValue[],
  defaultLanguageTag: string,
): StringsValue[] {
  if (!defaultLanguageTag) return values;
  const defaultIndex = values.findIndex(v => v.languageTag === defaultLanguageTag);
  if (defaultIndex <= 0) return values;
  const ordered = [ ...values ];
  const [ defaultValue ] = ordered.splice(defaultIndex, 1);
  if (defaultValue === undefined) return values;
  ordered.unshift(defaultValue);
  return ordered;
}

export function itemToStringsValue(item: Pick<Item, 'string'>): StringsValue {
  return {
    languageTag: item.string.languageTag || '',
    title: item.string.title || '',
    subtitle: item.string.subtitle || '',
    description: item.string.description || '',
  };
}

/** Server-side language tab not fetched yet — exclude from save and validation. */
export function isUnloadedServerPlaceholder(
  value: StringsValue,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): boolean {
  const isServerLanguage = itemSupportedLanguageTags.includes(value.languageTag);
  const isLoaded = loadedLanguageTags.includes(value.languageTag);
  return isServerLanguage && !isLoaded && !value.title && !value.subtitle && !value.description;
}

export function filterOutboundStringsValues(
  values: StringsValue[],
  pendingDeletions: ReadonlySet<string>,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): StringsValue[] {
  return values.filter(v => {
    if (pendingDeletions.has(v.languageTag)) return false;
    if (isUnloadedServerPlaceholder(v, itemSupportedLanguageTags, loadedLanguageTags)) return false;
    return true;
  });
}

export function isStringsValueSubjectToValidation(
  value: StringsValue,
  pendingDeletions: ReadonlySet<string>,
  itemSupportedLanguageTags: string[],
  loadedLanguageTags: string[],
): boolean {
  if (value.languageTag === '' || pendingDeletions.has(value.languageTag)) return false;
  return !isUnloadedServerPlaceholder(value, itemSupportedLanguageTags, loadedLanguageTags);
}
