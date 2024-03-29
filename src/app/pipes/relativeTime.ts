import { Pipe, PipeTransform } from '@angular/core';
import { DAYS, HOURS, MINUTES, MONTHS } from '../utils/duration';
import { LocaleService } from '../services/localeService';

const formatTime = (locale?: string) => (value: string | Date): string => {
  const valueDate = new Date(value);
  if (isNaN(valueDate.getTime())) {
    throw new Error(`Unexpected: Invalid date value: '${ value.toString() }'`);
  }

  const currentDate = new Date();
  const currentLocale = locale || 'en';

  const diffInMS = valueDate.getTime() - currentDate.getTime();
  const formatter = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
  const absDiffInMS = Math.abs(diffInMS);

  if (absDiffInMS < MINUTES) {
    return $localize`Just now`;
  }

  if (absDiffInMS > MINUTES && absDiffInMS < HOURS) {
    return formatter.format(Math.trunc(diffInMS / MINUTES), 'minutes');
  }

  if (absDiffInMS > HOURS && absDiffInMS < DAYS) {
    return formatter.format(Math.trunc(diffInMS / HOURS), 'hours');
  }

  if (absDiffInMS > DAYS && absDiffInMS < MONTHS) {
    return formatter.format(Math.trunc(diffInMS / DAYS), 'days');
  }

  if (absDiffInMS > MONTHS && absDiffInMS < (MONTHS * 2)) {
    return $localize`1 month ago`;
  }

  return formatter.format(Math.trunc(diffInMS / MONTHS), 'months');
};

@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {

  constructor(private localeService: LocaleService) {
  }

  transform = formatTime(this.localeService.currentLang?.tag);
}
