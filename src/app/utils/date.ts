
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
 * Short timezone name at `date` (DST-aware).
 * Uses `en-GB` so Intl returns a CLDR abbreviation where one exists (e.g. `CET` / `CEST`),
 * otherwise a `GMT±H` offset.
 */
export function formatTimeZoneName(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(date);
  return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
}
