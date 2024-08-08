import { EMPTY, noop, Observable, of, OperatorFunction, pipe } from 'rxjs';
import { catchError, filter, map, startWith, switchMap } from 'rxjs/operators';
import { errorState, FetchError, fetchingState, FetchState, Ready, readyState, mapStateData as mapStateDataFct } from '../state';

/**
 * Rx operator which first emits a loading state and then emit a ready or error state depending on the source. Never fails.
 * If resetter is given in arg, resubscribe the source each time the resetter emits.
 * If a resetter is given, the returned observable completes only when the resetter (and the source) completes (so do not forget to complete
 * the resetter)
 */
export function mapToFetchState<T, U = undefined>(
  config?: { resetter?: Observable<unknown>, identifier?: U }
): OperatorFunction<T,FetchState<T, U>> {
  const resetter = config?.resetter ? config?.resetter : EMPTY;
  let previousData: T|undefined;
  return pipe(
    map(val => readyState(val, config?.identifier)),
    startWith(fetchingState(undefined, config?.identifier)),
    mapErrorToState(config?.identifier),
    source => resetter.pipe(
      startWith(noop),
      switchMap(() => source),
    ),
    map(state => {
      if (state.isReady) previousData = state.data;
      if (state.isError) previousData = undefined;
      return state.isFetching ? fetchingState(previousData, config?.identifier) : state;
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
 * Rx operator which maps the data (if any) using the `dataMapper` function and otherwise keeps the state unchanged
 */
export function mapStateData<T, V, U = undefined>(dataMapper: (data: T) => V): OperatorFunction<FetchState<T,U>,FetchState<V,U>> {
  return pipe(
    map(s => mapStateDataFct(s, dataMapper)),
  );
}

/**
 * Rx operator which convert observable error to "error state". To be used when the state is built "manually".
 */
export function mapErrorToState<T, U = undefined>(identifier?: U): OperatorFunction<T, T|FetchError<U>> {
  return pipe(
    catchError(e => of(errorState(e, identifier))),
  );
}
