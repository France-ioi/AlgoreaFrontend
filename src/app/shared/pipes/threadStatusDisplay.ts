import { Pipe, PipeTransform } from '@angular/core';
import { Thread } from '../../modules/item/services/get-threads.service';

function formatThreadStatus(type: Thread['status']): string {
  switch (type) {
    case 'not_started': return $localize`Not started`;
    case 'waiting_for_participant': return $localize`Waiting for participant`;
    case 'waiting_for_trainer': return $localize`Waiting for trainer`;
    case 'closed': return $localize`Closed`;
    default: return type;
  }
}

@Pipe({ name: 'threadStatusDisplay' })
export class ThreadStatusDisplayPipe implements PipeTransform {
  transform = formatThreadStatus;
}
