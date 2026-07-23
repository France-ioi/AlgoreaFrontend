import { EMPTY, MonoTypeOperatorFunction, catchError, concatMap, of, tap } from 'rxjs';
import { reportAnError } from '../error-handling/error-reporting';

/**
 * Runs a synchronous side effect per emission without letting a throw kill the source stream.
 * Isolates each value in `of(value)` so catchError only completes that emission and the effect stays alive.
 */
export function runSideEffectSafely<T>(sideEffect: (value: T) => void): MonoTypeOperatorFunction<T> {
  return concatMap(value => of(value).pipe(
    tap(sideEffect),
    catchError(err => {
      reportAnError(err);
      return EMPTY;
    }),
  ));
}
