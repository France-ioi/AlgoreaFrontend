
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

/**
 * Factory for building an T|null comparator by wrapping a T comparator
 */
export function equalNullableFactory<T>(fct: (v1: T, v2: T) => boolean): (v1: T|null, v2: T|null) => boolean {
  return (v1: T|null, v2: T|null) => {
    if (v1 === v2) return true;
    if (v1 === null || v2 === null) return false;
    return fct(v1, v2);
  };
}
