import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from '../helpers/duration';

@Pipe({
  name: 'toMin',
  standalone: true
})
export class DurationToMinPipe implements PipeTransform {
  transform(duration: Duration): number {
    return duration.minutes();
  }
}

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationToReadable implements PipeTransform {
  transform(duration: number): string {
    return Duration.fromSeconds(duration).toReadable();
  }
}
