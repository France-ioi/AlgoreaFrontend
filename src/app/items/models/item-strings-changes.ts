import { ItemStringChanges } from 'src/app/items/data-access/update-item-string.service';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';

/** Diff a single per-language strings value against its initial value. */
export function buildItemStringChanges(
  value: StringsValue,
  { initialValue }: { initialValue?: StringsValue },
): { changes: ItemStringChanges, languageTag: string } {
  const changes: ItemStringChanges = {};

  if (value.title !== initialValue?.title) changes.title = value.title.trim();
  if (value.subtitle !== initialValue?.subtitle) changes.subtitle = value.subtitle;
  if (value.description !== initialValue?.description) changes.description = value.description;

  return { changes, languageTag: value.languageTag };
}

/** Build per-language changes for every edited string; entries with no actual change are dropped. */
export function buildItemAllStringsChanges(
  allStringsValue: StringsValue[],
  initialLanguageValues: StringsValue[],
): { changes: ItemStringChanges, languageTag: string }[] {
  return allStringsValue.map(v =>
    buildItemStringChanges(v, {
      initialValue: initialLanguageValues.find(iv => iv.languageTag === v.languageTag),
    })
  ).filter(({ changes }) => Object.keys(changes).length > 0);
}

/** Language tags to delete on save: dropped from outbound and/or marked pending-deletion on the server. */
export function collectStringsToRemove(
  outbound: StringsValue[],
  initialLanguageValues: StringsValue[],
  pendingDeletions: ReadonlySet<string>,
  serverSupportedLanguageTags: string[],
): string[] {
  const outboundTags = new Set(outbound.map(v => v.languageTag));
  const toRemove = initialLanguageValues
    .filter(v => !outboundTags.has(v.languageTag))
    .map(v => v.languageTag);

  for (const languageTag of pendingDeletions) {
    if (!serverSupportedLanguageTags.includes(languageTag)) continue;
    if (outboundTags.has(languageTag)) continue;
    if (toRemove.includes(languageTag)) continue;
    toRemove.push(languageTag);
  }

  return toRemove;
}
