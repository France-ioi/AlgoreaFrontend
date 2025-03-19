import { defer, finalize, noop, OperatorFunction, pipe } from 'rxjs';

/**
 * For debugging, allow doing an action (such as logging) on subscription count update.
 */
export function logRefCount<T>(onCountUpdate: (n: number) => void = noop): OperatorFunction<T, T> {
  let counter = 0;

  return pipe(
    source => defer(() => {
      counter++;
      onCountUpdate(counter);
      return source;
    }),
    finalize(() => {
      counter--;
      onCountUpdate(counter);
    }),
  );
}

