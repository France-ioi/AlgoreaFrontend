import { of, OperatorFunction, pipe } from 'rxjs';
import { catchError, filter, map, startWith } from 'rxjs/operators';
import { errorState, fetchingState, FetchState, Ready, readyState } from 'src/app/shared/helpers/state';

/**
 * Rx operator which first emits a loading state and then emit a ready or error state depending on the source. Never fails.
 */
export function mapToFetchState<T>(): OperatorFunction<T,FetchState<T>> {
  return pipe(
    map(val => readyState(val)),
    startWith(fetchingState()),
    catchError(e => of(errorState(e))),
  );
}

/**
 * Rx operator which filters only ready states
 */
export function readyOnly<T>(): OperatorFunction<FetchState<T>,Ready<T>> {
  return pipe(
    filter((s): s is Ready<T> => s.isReady)
  );
}
