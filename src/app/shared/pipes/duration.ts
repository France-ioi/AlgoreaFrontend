import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from '../helpers/duration';

@Pipe({ name: 'toMin' })
export class DurationToMinPipe implements PipeTransform {
  transform(duration: Duration): number {
    return duration.minutes();
  }
}
