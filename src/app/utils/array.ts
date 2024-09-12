
/**
 * Return whether `arr1` equals `arr2`, i.e. every value equals (using `===`)
 */
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((id, idx) => id === arr2[idx]);
}

/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>();
  list.forEach(item => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) map.set(key, [ item ]);
    else collection.push(item);
  });
  return map;
}

/**
 * Return the median of the array. If there is an even number of values, use the average of the 2 median values.
 * Do not modify the input list.
 * @param list a non-empty array
 */
export function median(list: number[]): number {
  if (list.length === 0) throw new Error('cannot compute median of an empty list');
  const sorted = [ ...list ].sort();
  if (list.length % 2 === 1) return sorted[(list.length-1)/2]!;
  return (sorted[list.length / 2]! + sorted[list.length / 2 + 1]!) / 2;
}
