import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from '../utils/duration';

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
  name: 'secToDuration',
  standalone: true
})
export class SecondsToDurationPipe implements PipeTransform {
  transform(seconds: number): Duration {
    return Duration.fromSeconds(seconds);
  }
}

@Pipe({
  name: 'readable',
  standalone: true
})
export class DurationToReadablePipe implements PipeTransform {
  transform(duration: Duration): string {
    return duration.toReadable();
  }
}

@Pipe({
  name: 'asCountdown',
  standalone: true
})
export class DurationAsCountdownPipe implements PipeTransform {
  transform(duration: Duration): string {
    return duration.toCountdown();
  }
}
