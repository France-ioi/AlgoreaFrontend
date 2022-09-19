import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { Action } from '../../http-services/request-actions.service';

export interface Result {
  countRequests: number,
  countSuccess: number,
}

export function displayResponseToast(feedbackService: ActionFeedbackService, result: Result, action: Action): void {
  const msg = action === Action.Accept ? $localize`accepted` : $localize`declined`;

  if (result.countSuccess === result.countRequests) {
    feedbackService.success($localize`${result.countSuccess} request(s) have been ${msg}`);
  } else if (result.countSuccess === 0) {
    const detailMsg = action === Action.Accept ?
      $localize`Unable to accept the selected request(s).` :
      $localize`Unable to reject the selected request(s).`;
    feedbackService.error(detailMsg);
  } else {
    const errCnt = result.countRequests - result.countSuccess;
    feedbackService.partial($localize`${result.countSuccess} request(s) have been ${msg}, ${errCnt} could not be executed`);
  }
}
