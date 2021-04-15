import { Pipe, PipeTransform } from '@angular/core';

function formatLogAction (type: 'result_started'|'submission'|'result_validated', score?: number): string {
  if (type === 'submission' && score === undefined) {
    return $localize`Submission`;
  } else if (type === 'submission' && score !== undefined) {
    return $localize`Submission (score: ${ score })`;
  } else if (type === 'result_started') {
    return $localize`Activity started`;
  } else if (type === 'result_validated') {
    return $localize`Activity validated`;
  } else {
    return type;
  }
}

@Pipe({ name: 'logActionDisplay' })
export class LogActionDisplay implements PipeTransform {
  transform = formatLogAction;
}
