import { Pipe, PipeTransform } from '@angular/core';
import { formatUtcOffset } from 'src/app/utils/date';

@Pipe({ name: 'utcOffset' })
export class UtcOffsetPipe implements PipeTransform {
  transform(date: Date): string {
    return formatUtcOffset(date);
  }
}
