import { Pipe, PipeTransform } from '@angular/core';
import { Thread } from '../data-access/get-threads.service';

function formatThreadStatus(type: Thread['status']): string {
  switch (type) {
    case 'not_started': return $localize`Not started`;
    case 'waiting_for_participant': return $localize`Open`;
    case 'waiting_for_trainer': return $localize`Open`;
    case 'closed': return $localize`Closed`;
    default: return type;
  }
}

@Pipe({
  name: 'threadStatusDisplay',
  standalone: true
})
export class ThreadStatusDisplayPipe implements PipeTransform {
  transform = formatThreadStatus;
}
