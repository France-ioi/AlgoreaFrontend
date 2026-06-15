import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from '../utils/duration';

@Pipe({
  name: 'toMin'
})
export class DurationToMinPipe implements PipeTransform {
  transform(duration: Duration): number {
    return duration.minutes();
  }
}

@Pipe({
  name: 'secToDuration'
})
export class SecondsToDurationPipe implements PipeTransform {
  transform(seconds: number): Duration {
    return Duration.fromSeconds(seconds);
  }
}

@Pipe({
  name: 'readable'
})
export class DurationToReadablePipe implements PipeTransform {
  transform(duration: Duration): string {
    return duration.toReadable();
  }
}

@Pipe({
  name: 'asCountdown'
})
export class DurationAsCountdownPipe implements PipeTransform {
  transform(duration: Duration): string {
    return duration.toCountdown();
  }
}
