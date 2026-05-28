import { Observable } from 'rxjs';
import {
  AllStringsFormValue,
  applyLocalCommitToFormValue,
  hasLocalOnlyPendingRemovals,
} from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { buildItemAllStringsChanges, collectStringsToRemove } from 'src/app/items/models/item-strings-changes';
import { ItemChanges } from '../../data-access/update-item.service';
import { UpdateItemStringService } from '../../data-access/update-item-string.service';
import { DeleteItemStringService } from 'src/app/items/data-access/delete-item-string.service';

export interface StringsSaveRequests {
  creates: Observable<void>[],
  updates: Observable<void>[],
  deletes: Observable<void>[],
}

export function buildStringsSaveRequests(
  itemId: string,
  allStrings: AllStringsFormValue,
  initialLanguageValues: StringsValue[],
  defaultLanguageTag: string,
  persistedImageUrl: string,
  imageUrlValue: string | null,
  serverSupportedLanguageTags: string[],
  updateItemStringService: UpdateItemStringService,
  deleteItemStringService: DeleteItemStringService,
): StringsSaveRequests {
  const stringsChanges = buildItemAllStringsChanges(
    allStrings.strings,
    initialLanguageValues,
    defaultLanguageTag,
    persistedImageUrl,
    imageUrlValue,
  );
  const initialLanguageTags = initialLanguageValues.map(v => v.languageTag);
  const languageTagsToRemove = collectStringsToRemove(
    allStrings.strings,
    initialLanguageValues,
    new Set(allStrings.pendingDeletions),
    serverSupportedLanguageTags,
  );

  const creates: Observable<void>[] = [];
  const updates: Observable<void>[] = [];
  for (const { changes, languageTag } of stringsChanges) {
    const request = updateItemStringService.updateItem(itemId, changes, languageTag);
    if (initialLanguageTags.includes(languageTag)) updates.push(request);
    else creates.push(request);
  }

  return {
    creates,
    updates,
    deletes: languageTagsToRemove.map(tag => deleteItemStringService.delete(itemId, tag)),
  };
}

export function hasAnyServerWork(
  itemChanges: ItemChanges,
  requests: StringsSaveRequests,
): boolean {
  return Object.keys(itemChanges).length > 0
    || requests.creates.length > 0
    || requests.updates.length > 0
    || requests.deletes.length > 0;
}

export function commitLocalStringsFormValue(
  current: AllStringsFormValue,
  serverSupportedLanguageTags: readonly string[],
): AllStringsFormValue | null {
  if (!hasLocalOnlyPendingRemovals(current, serverSupportedLanguageTags)) return null;
  return applyLocalCommitToFormValue(current, serverSupportedLanguageTags).value;
}
