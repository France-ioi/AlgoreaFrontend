import { Item } from 'src/app/data-access/get-item-by-id.service';
import { ItemStringChanges } from 'src/app/items/data-access/update-item-string.service';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';

/**
 * Diff a single per-language strings value against its initial value.
 *
 * `imageUrl` is sent on the default-language string only (backend stores it on the item string,
 * not on the item) — callers pass `imageUrlValue` only for the default-language record and only
 * when it differs from the persisted value. The caller passes an empty string when the user
 * cleared the field; we forward that as `null` so the backend actually removes the stored value
 * (vs. the previous behaviour, which dropped the property entirely and left the URL in place).
 */
export function buildItemStringChanges(
  value: StringsValue,
  { initialValue, imageUrlValue }: { initialValue?: StringsValue, imageUrlValue?: string },
): { changes: ItemStringChanges, languageTag: string } {
  const changes: ItemStringChanges = {};

  if (imageUrlValue !== undefined) changes.image_url = imageUrlValue === '' ? null : imageUrlValue;
  if (value.title !== initialValue?.title) changes.title = value.title.trim();
  if (value.subtitle !== initialValue?.subtitle) changes.subtitle = value.subtitle;
  if (value.description !== initialValue?.description) changes.description = value.description;

  return { changes, languageTag: value.languageTag };
}

/** Build per-language changes for every edited string; entries with no actual change are dropped. */
export function buildItemAllStringsChanges(
  allStringsValue: StringsValue[],
  initialLanguageValues: StringsValue[],
  defaultLanguageTag: string,
  initialItem: Pick<Item, 'string'>,
  imageUrlValue: string | null,
): { changes: ItemStringChanges, languageTag: string }[] {
  const defaultLangIdx = initialLanguageValues.findIndex(l => l.languageTag === defaultLanguageTag);
  // Normalise the backend value: it is `null` when never set, and the form value is `''` in that
  // case — without this, clearing nothing would still be reported as a change.
  const initialImageUrl = initialItem.string.imageUrl ?? '';
  const imageUrlChanged = imageUrlValue !== null && imageUrlValue !== initialImageUrl;
  return allStringsValue.map((v, idx) =>
    buildItemStringChanges(v, {
      initialValue: initialLanguageValues.find(iv => iv.languageTag === v.languageTag),
      ...(idx === defaultLangIdx && imageUrlChanged ? { imageUrlValue } : {}),
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
