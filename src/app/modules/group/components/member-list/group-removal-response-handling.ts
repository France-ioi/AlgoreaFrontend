import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

export interface Result {
  countRequests: number,
  countSuccess: number,
  errorText?: string,
}

export function displayGroupRemovalResponseToast(feedbackService: ActionFeedbackService, result: Result): void {
  if (result.countSuccess === result.countRequests) {
    feedbackService.success($localize`${result.countSuccess} group(s) have been removed`);
  } else if (result.countSuccess === 0) {
    feedbackService.error($localize`Unable to remove the selected group(s). ` + `${result.errorText || ''}`);
  } else {
    feedbackService.partial(
      $localize`${result.countSuccess} group(s) have been removed, ${result.countRequests - result.countSuccess} could
       not be removed. ` + `${result.errorText || ''}`
    );
  }
}
