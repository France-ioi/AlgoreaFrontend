import { EMPTY, noop, Observable, of, OperatorFunction, pipe } from 'rxjs';
import { catchError, filter, map, startWith, switchMapTo } from 'rxjs/operators';
import { errorState, fetchingState, FetchState, Ready, readyState } from 'src/app/shared/helpers/state';
import { implementsError } from '../helpers/errors';

/**
 * Rx operator which first emits a loading state and then emit a ready or error state depending on the source. Never fails.
 * If resetter is given in arg, resubscribe the source each time the resetter emits.
 * If a resetter is given, the returned observable completes only when the resetter (and the source) completes (so do not forget to complete
 * the resetter)
 */
export function mapToFetchState<T>(config?: { resetter?: Observable<unknown> }): OperatorFunction<T,FetchState<T>> {
  const resetter = config?.resetter ? config?.resetter : EMPTY;
  let previousData: T|undefined;
  return pipe(
    map(val => readyState(val)),
    startWith(fetchingState()),
    mapErrorToState<T>(),
    source => resetter.pipe(
      startWith(noop),
      switchMapTo(source)
    ),
    map(state => {
      if (state.isReady) previousData = state.data;
      if (state.isError) previousData = undefined;
      return state.isFetching ? fetchingState(previousData) : state;
    }),
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
 * Rx operator which maps the data (if any) using the `dataMapper` function and keeps the state unchanged
 */
export function mapStateData<T, U>(dataMapper: (data: T) => U): OperatorFunction<FetchState<T>,FetchState<U>> {
  return pipe(
    map(state => {
      if (state.isReady) return readyState(dataMapper(state.data));
      if (state.isFetching) return fetchingState(state.data === undefined ? undefined : dataMapper(state.data));
      return state; // error state is not changed
    }),
  );
}

/**
 * Rx operator which convert observable error to "error state". To be used when the state is built "manually".
 */
export function mapErrorToState<T>(): OperatorFunction<FetchState<T>,FetchState<T>> {
  return pipe(
    catchError(e => of(errorState(implementsError(e) ? e : new Error('unknown error')))),
  );
}
