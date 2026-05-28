/** Dedupes ControlValueAccessor outbound emissions that echo the last stored value. */
export interface CvaEcho<T> {
  rememberInbound(value: T): void,
  emitIfChanged(value: T, onChange: (value: T) => void): void,
  clear(): void,
}

export function createCvaEcho<T>(
  equal: (a: T, b: T) => boolean,
  cloneOnStore: (value: T) => T = value => value,
): CvaEcho<T> {
  let last: T | null = null;

  return {
    rememberInbound(value: T): void {
      last = cloneOnStore(value);
    },
    emitIfChanged(value: T, onChange: (value: T) => void): void {
      if (last !== null && equal(value, last)) return;
      last = cloneOnStore(value);
      onChange(value);
    },
    clear(): void {
      last = null;
    },
  };
}
