type CompareFn = (a: unknown, b: unknown) => boolean;

/** Field-wise equality for flat records; optional per-key comparers for non-primitive fields. */
export function shallowEqual<T extends object>(
  a: T,
  b: T,
  keys: readonly (keyof T)[],
  compare: Partial<Record<keyof T, CompareFn>> = {},
): boolean {
  for (const key of keys) {
    const customCompare = compare[key];
    if (customCompare) {
      if (!customCompare(a[key], b[key])) return false;
    } else if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function nullableDatesEqual(a: unknown, b: unknown): boolean {
  const dateA = a instanceof Date ? a : null;
  const dateB = b instanceof Date ? b : null;
  return (dateA?.getTime() ?? null) === (dateB?.getTime() ?? null);
}

export function nullableDurationMsEqual(a: unknown, b: unknown): boolean {
  const msA = a !== null && typeof a === 'object' && 'ms' in a ? (a as { ms: number }).ms : null;
  const msB = b !== null && typeof b === 'object' && 'ms' in b ? (b as { ms: number }).ms : null;
  return msA === msB;
}
