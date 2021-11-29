import { Pipe, PipeTransform } from '@angular/core';
import { ActivityLog } from '../http-services/activity-log.service';

function formatLogAction (type: ActivityLog['activityType'], score?: number): string {
  switch (type) {
    case 'submission': return score === undefined ? $localize`Submission` : $localize`Submission (score: ${ score })`;
    case 'result_started': return $localize`Activity started`;
    case 'result_validated': return $localize`Activity validated`;
    case 'current_answer': return $localize`Current answer`;
    case 'saved_answer': return $localize`Saved answer`;
    default: return type;
  }
}

@Pipe({ name: 'logActionDisplay' })
export class LogActionDisplayPipe implements PipeTransform {
  transform = formatLogAction;
}
