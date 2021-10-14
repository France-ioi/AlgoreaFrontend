
/**
 * Return whether `arr1` equals `arr2`, i.e. every value equals (using `===`)
 */
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((id, idx) => id === arr2[idx]);
}
