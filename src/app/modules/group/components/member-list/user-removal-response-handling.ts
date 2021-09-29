import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

export interface Result {
  countRequests: number,
  countSuccess: number,
}

export function displayResponseToast(feedbackService: ActionFeedbackService, result: Result): void {
  if (result.countSuccess === result.countRequests) {
    feedbackService.success($localize`${result.countSuccess} user(s) have been removed`);
  } else if (result.countSuccess === 0) {
    feedbackService.error($localize`Unable to remove the selected user(s)`);
  } else {
    feedbackService.partial(
      $localize`${result.countSuccess} user(s) have been removed, ${result.countRequests - result.countSuccess} could not be removed`
    );
  }
}
