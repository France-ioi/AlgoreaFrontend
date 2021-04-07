import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';

export interface Result {
  countRequests: number;
  countSuccess: number;
}

export function displayResponseToast(messageService: MessageService, result: Result): void {
  if (result.countSuccess === result.countRequests) {
    messageService.add({
      severity: 'success',
      summary: $localize`Success`,
      detail: $localize`${result.countSuccess} user(s) have been removed`,
      life: TOAST_LENGTH,
    });
  } else if (result.countSuccess === 0) {
    messageService.add({
      severity: 'error',
      summary: $localize`Error`,
      detail: $localize`Unable to remove the selected user(s)`,
      life: TOAST_LENGTH,
    });
  } else {
    messageService.add({
      severity: 'warn',
      summary: $localize`Partial success`,
      detail:
        $localize`${result.countSuccess} user(s) have been removed, ${result.countRequests - result.countSuccess} could not be removed`,
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

export function parseResults(data: Map<string, any>): { countRequests: number, countSuccess: number } {
  const res = {
    countRequests: data.size,
    countSuccess: Array.from(data.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0) };
  return res;
}
