
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
