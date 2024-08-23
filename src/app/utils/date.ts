
export const farFutureDateString = '2099-12-30T23:59:00Z';
export const backendInfiniteDateString = '9999-12-31T23:59:59Z';

/**
 * The backend may return date in the far future to express "forever". This function checks the value.
 */
export function isInfinite(d: Date): boolean {
  return d > new Date('2099-01-01');
}
