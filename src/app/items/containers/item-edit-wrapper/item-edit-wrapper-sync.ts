import { Item } from 'src/app/data-access/get-item-by-id.service';
import {
  itemToStringsValue,
  stringsValueEqual,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import {
  ItemParametersValue,
  itemToParametersValue,
} from 'src/app/items/models/item-parameters';
import { Duration } from 'src/app/utils/duration';

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

/** Whether a same-id `ItemData` refresh should re-derive the parameters save baseline. */
export function shouldResyncParametersBaseline(prev: Item | undefined, curr: Item): boolean {
  if (!prev || prev.id !== curr.id) return false;
  return !parametersValuesEqual(itemToParametersValue(prev), itemToParametersValue(curr));
}

export function shouldResyncServerBaseline(prev: Item | undefined, curr: Item): boolean {
  return shouldResyncStringsBaseline(prev, curr) || shouldResyncParametersBaseline(prev, curr);
}

function parametersValuesEqual(a: ItemParametersValue, b: ItemParametersValue): boolean {
  return JSON.stringify(normalizeParametersForCompare(a)) === JSON.stringify(normalizeParametersForCompare(b));
}

function normalizeParametersForCompare(value: ItemParametersValue): unknown {
  return {
    ...value,
    duration: durationMs(value.duration),
    enteringTimeMin: dateMs(value.enteringTimeMin),
    enteringTimeMax: dateMs(value.enteringTimeMax),
  };
}

function durationMs(duration: Duration | null): number | null {
  return duration?.ms ?? null;
}

function dateMs(date: Date | null): number | null {
  return date?.getTime() ?? null;
}
