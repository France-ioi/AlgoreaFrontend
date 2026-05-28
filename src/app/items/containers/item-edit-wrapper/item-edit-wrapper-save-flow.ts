import { HttpErrorResponse } from '@angular/common/http';
import { ValidationErrors } from '@angular/forms';
import { Observable, concat, forkJoin, toArray } from 'rxjs';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { AllStringsFormValue } from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { ItemChanges } from '../../data-access/update-item.service';
import { UpdateItemStringService } from '../../data-access/update-item-string.service';
import { DeleteItemStringService } from 'src/app/items/data-access/delete-item-string.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import {
  buildStringsSaveRequests,
  commitLocalStringsFormValue,
  hasAnyServerWork,
} from './item-edit-wrapper-save';

export interface ItemEditSaveFlowContext {
  itemId: string,
  initialItem: Item,
  getAllStrings: () => AllStringsFormValue,
  getDefaultLanguageTag: () => string,
  getImageUrl: () => string | null,
  initialLanguageValues: StringsValue[],
  serverSupportedLanguageTags: string[],
  itemChanges: ItemChanges,
  updateItem: (changes: ItemChanges) => Observable<void>,
  updateItemStringService: UpdateItemStringService,
  deleteItemStringService: DeleteItemStringService,
  actionFeedbackService: ActionFeedbackService,
  setFormsDisabled: (disabled: boolean) => void,
  onSaveSuccess: (kind: 'local-only' | 'server') => void,
  onValidationError: (errors: ValidationErrors) => void,
  onUnexpectedError: (err: unknown) => void,
}

export function hasLocalOnlyStringsCommit(
  allStrings: AllStringsFormValue,
  serverSupportedLanguageTags: readonly string[],
): boolean {
  return commitLocalStringsFormValue(allStrings, serverSupportedLanguageTags) !== null;
}

export function runItemEditSave(ctx: ItemEditSaveFlowContext): void {
  const stringsRequests = buildStringsSaveRequests(
    ctx.itemId,
    ctx.getAllStrings(),
    ctx.initialLanguageValues,
    ctx.getDefaultLanguageTag(),
    ctx.initialItem,
    ctx.getImageUrl(),
    ctx.serverSupportedLanguageTags,
    ctx.updateItemStringService,
    ctx.deleteItemStringService,
  );
  const trailingRequests = [ ...stringsRequests.updates, ...stringsRequests.deletes ];
  if (!hasAnyServerWork(ctx.itemChanges, stringsRequests)) {
    if (hasLocalOnlyStringsCommit(ctx.getAllStrings(), ctx.serverSupportedLanguageTags)) {
      ctx.onSaveSuccess('local-only');
      ctx.actionFeedbackService.success($localize`Pending changes discarded.`);
    }
    return;
  }

  const requests$ = [
    ...(stringsRequests.creates.length > 0 ? [ forkJoin(stringsRequests.creates) ] : []),
    ctx.updateItem(ctx.itemChanges),
    ...(trailingRequests.length > 0 ? [ forkJoin(trailingRequests) ] : []),
  ];

  ctx.setFormsDisabled(true);
  concat(...requests$).pipe(toArray()).subscribe({
    next: () => {
      ctx.setFormsDisabled(false);
      ctx.onSaveSuccess('server');
      ctx.actionFeedbackService.success($localize`Changes successfully saved.`);
    },
    error: (err: unknown) => {
      ctx.setFormsDisabled(false);
      const validationErrors = getServerValidationErrors(err);
      if (validationErrors) {
        ctx.onValidationError(validationErrors);
        return;
      }
      ctx.onUnexpectedError(err);
    },
  });
}

function getServerValidationErrors(err: unknown): ValidationErrors | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const errorBody: unknown = err.error;
  if (errorBody === null || typeof errorBody !== 'object' || !('errors' in errorBody)) return null;
  const errors: unknown = errorBody.errors;
  if (errors === null || typeof errors !== 'object') return null;
  return errors;
}
