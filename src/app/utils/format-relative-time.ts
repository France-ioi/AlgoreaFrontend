import { DAYS, HOURS, MINUTES, MONTHS, WEEKS, YEARS } from './duration';

export function formatRelativeTime(value: string | Date, locale = 'en'): string {
  const valueDate = new Date(value);
  if (isNaN(valueDate.getTime())) {
    throw new Error(`Unexpected: Invalid date value: '${ value.toString() }'`);
  }

  const diffInMS = valueDate.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const absDiffInMS = Math.abs(diffInMS);

  if (absDiffInMS < MINUTES) {
    return $localize`Just now`;
  }

  if (absDiffInMS < HOURS) {
    return formatter.format(Math.trunc(diffInMS / MINUTES), 'minutes');
  }

  if (absDiffInMS < DAYS) {
    return formatter.format(Math.trunc(diffInMS / HOURS), 'hours');
  }

  if (absDiffInMS < WEEKS) {
    return formatter.format(Math.trunc(diffInMS / DAYS), 'days');
  }

  if (absDiffInMS < (MONTHS * 3)) {
    return formatter.format(Math.trunc(diffInMS / WEEKS), 'weeks');
  }

  if (absDiffInMS < YEARS) {
    return formatter.format(Math.trunc(diffInMS / MONTHS), 'months');
  }

  return formatter.format(Math.trunc(diffInMS / YEARS), 'years');
}

export function computeRefreshInterval(value: string | Date): number {
  const age = Math.abs(Date.now() - new Date(value).getTime());
  if (age < MINUTES) return 10_000;
  if (age < HOURS) return 30_000;
  if (age < DAYS) return 5 * MINUTES;
  return 30 * MINUTES;
}
