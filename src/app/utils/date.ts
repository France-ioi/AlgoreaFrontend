
export const farFutureDateString = '2099-12-30T23:59:00Z';
export const backendInfiniteDateString = '9999-12-31T23:59:59Z';

/**
 * The backend may return date in the far future to express "forever". This function checks the value.
 */
export function isInfinite(d: Date): boolean {
  return d > new Date('2099-01-01');
}

export function isPastDate(d: Date): boolean {
  return d < new Date();
}

/**
 * Local UTC offset label for display, e.g. `UTC+2` or `UTC+5:30`.
 * Uses the offset that applies at `date` (DST-aware).
 */
export function formatUtcOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}
