import { Pipe, PipeTransform } from '@angular/core';
import { ActivityLogs } from 'src/app/data-access/activity-log.service';

@Pipe({
  name: 'logActivityTypeIcon',
  pure: true,
  standalone: true
})
export class LogActivityTypeIcon implements PipeTransform {
  transform(activity: ActivityLogs[number]['activityType']): string {
    switch (activity) {
      case 'result_started': return 'ph-duotone ph-flag-checkered';
      case 'saved_answer': return 'ph-duotone ph-floppy-disk-back';
      case 'result_validated': return 'ph ph-check-circle alg-font-size-38';
      default: return '';
    }
  }
}
