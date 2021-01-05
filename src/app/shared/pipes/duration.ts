import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from '../helpers/duration';

@Pipe({ name: 'toMin' })
export class DurationToMinPipe implements PipeTransform {
  transform(duration: Duration): number {
    return duration.minutes();
  }
}

@Pipe({ name: 'duration' })
export class DurationToReadable implements PipeTransform {
  transform(duration: number): string {
    if (duration < 60) {
      return `${Math.floor(duration)} min`;
    } else if (duration < 60 * 24) {
      return `${Math.floor(duration / 60)} hours`;
    } else if (duration < 60 * 24 * 30) {
      return `${Math.floor(duration / 60 / 24)} days`;
    } else {
      return `${Math.floor(duration / 60 / 24 / 30)} months`;
    }
  }
}
