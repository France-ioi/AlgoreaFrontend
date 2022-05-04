import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { Result } from '../../http-services/remove-group-manager.service';

export function displayGroupManagerRemovalResponseToast(feedbackService: ActionFeedbackService, result: Result): void {
  if (result.countSuccess === result.countRequests) {
    feedbackService.success($localize`${result.countSuccess} manager(s) have been removed`);
  } else if (result.countSuccess === 0) {
    feedbackService.error($localize`Unable to remove the selected manager(s). ` + `${result.errorText || ''}`);
  } else {
    feedbackService.partial(
      $localize`${result.countSuccess} manager(s) have been removed, ${result.countRequests - result.countSuccess} could
       not be removed. ` + `${result.errorText || ''}`
    );
  }
}
