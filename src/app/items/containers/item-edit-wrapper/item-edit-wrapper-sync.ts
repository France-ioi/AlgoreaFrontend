import { Item } from 'src/app/data-access/get-item-by-id.service';
import {
  itemToStringsValue,
  stringsValueEqual,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';

function tagsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [ ...a ].sort().join(',');
  const sortedB = [ ...b ].sort().join(',');
  return sortedA === sortedB;
}

/** Whether a same-id `ItemData` refresh should re-derive the strings save baseline. */
export function shouldResyncStringsBaseline(prev: Item | undefined, curr: Item): boolean {
  if (!prev || prev.id !== curr.id) return false;
  if (prev.defaultLanguageTag !== curr.defaultLanguageTag) return true;
  if (!tagsEqual(prev.supportedLanguageTags, curr.supportedLanguageTags)) return true;
  return !stringsValueEqual(itemToStringsValue(prev), itemToStringsValue(curr));
}
