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
 * Rx operator which only keeps data of ready states (i.e., which removes non-ready states and maps ready state to their data)
 */
export function readyData<T>(): OperatorFunction<FetchState<T>,T> {
  return pipe(
    filter((s): s is Ready<T> => s.isReady),
    map(s => s.data)
  );
}

/**
 * Rx operator which maps the ready data using the `dataMapper` function or keep the state unchanged if the state is not ready
 */
export function mapStateData<T, U>(dataMapper: (data: T) => U): OperatorFunction<FetchState<T>,FetchState<U>> {
  return pipe(
    map(state => (state.isReady ? readyState(dataMapper(state.data)) : state))
  );
}
