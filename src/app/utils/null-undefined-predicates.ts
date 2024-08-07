
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
 * Factory for building an T|null|undefined comparator by wrapping a T comparator
 */
export function equalNullishFactory<T>(fct: (v1: T, v2: T) => boolean): (v1: T|null|undefined, v2: T|null|undefined) => boolean {
  return (v1: T|null|undefined, v2: T|null|undefined) => {
    if (v1 === v2) return true;
    if (v1 === null || v2 === null) return false;
    if (v1 === undefined || v2 === undefined) return false;
    return fct(v1, v2);
  };
}
