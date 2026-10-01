import { Pipe, PipeTransform } from '@angular/core';
import { formatTimeZoneName } from 'src/app/utils/date';

@Pipe({ name: 'timeZoneName' })
export class TimeZoneNamePipe implements PipeTransform {
  transform(date: Date | null | undefined): string {
    if (date === null || date === undefined || isNaN(date.getTime())) return '';
    return formatTimeZoneName(date);
  }
}
