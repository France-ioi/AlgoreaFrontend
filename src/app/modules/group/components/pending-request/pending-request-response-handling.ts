import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { Action } from '../../http-services/request-actions.service';

export interface Result {
  countRequests: number;
  countSuccess: number;
}

export function displayResponseToast(messageService: MessageService, result: Result, action: Action): void {
  const msg = action === Action.Accept ? $localize`accepted` : $localize`declined`;

  if (result.countSuccess === result.countRequests) {
    messageService.add({
      severity: 'success',
      summary: $localize`Success`,
      detail: $localize`${result.countSuccess} request(s) have been ${msg}`,
      life: TOAST_LENGTH,
    });
  } else if (result.countSuccess === 0) {
    const detailMsg = action === Action.Accept ?
      $localize`Unable to accept the selected request(s).` :
      $localize`Unable to reject the selected request(s).`;
    messageService.add({
      severity: 'error',
      summary: $localize`Error`,
      detail: detailMsg,
      life: TOAST_LENGTH,
    });
  } else {
    messageService.add({
      severity: 'warn',
      summary: $localize`Partial success`,
      detail:
        $localize`${result.countSuccess} request(s) have been ${msg}, ${result.countRequests - result.countSuccess} could not be executed`,
      life: TOAST_LENGTH,
    });
  }
}

export function processRequestError(messageService: MessageService): void {
  messageService.add({
    severity: 'error',
    summary: $localize`Error`,
    detail: ERROR_MESSAGE.fail,
    life: TOAST_LENGTH,
  });
}
