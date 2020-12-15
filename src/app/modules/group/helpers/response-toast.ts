import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';

export interface Result {
  countRequests: number;
  countSuccess: number;
}

export function displayResponseToast(messageService: MessageService, result: Result, verb: string, msg: string): void {
  if (result.countSuccess === result.countRequests) {
    messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${result.countSuccess} request(s) have been ${msg}`,
      life: TOAST_LENGTH,
    });
  } else if (result.countSuccess === 0) {
    messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Unable to ${verb} the selected request(s).`,
      life: TOAST_LENGTH,
    });
  } else {
    messageService.add({
      severity: 'warn',
      summary: 'Partial success',
      detail: `${result.countSuccess} request(s) have been ${msg}, ${result.countRequests - result.countSuccess} could not be executed`,
      life: TOAST_LENGTH,
    });
  }
}

export function processRequestError(messageService: MessageService): void {
  messageService.add({
    severity: 'error',
    summary: 'Error',
    detail: ERROR_MESSAGE.fail,
    life: TOAST_LENGTH,
  });
}
