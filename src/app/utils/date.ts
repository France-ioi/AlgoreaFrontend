
/**
 * The backend may return date in the far future to express "forever". This function checks the value.
 */
export function isInfinite(d: Date): boolean {
  return d > new Date('2099-01-01');
}
