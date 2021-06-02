
export function isNotNullOrUndefined<T>(e: T|null|undefined): e is T {
  return e !== null && e !== undefined;
}

export function isNotNull<T>(e: T|null): e is T {
  return e !== null;
}

export function isNotUndefined<T>(e: T|undefined): e is T {
  return e !== undefined;
}

export const isDefined = isNotUndefined;

export function ensureDefined<T>(value: T | undefined, message = 'expected value to be defined'): T {
  if (isNotUndefined(value)) return value;
  throw new Error(message);
}
