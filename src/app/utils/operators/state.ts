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
 * Variant of `mapToFetchState` for input-driven pipelines. Given a stream of inputs and a fetch
 * function, emits a `FetchState<T>` per input. Because `catchError` lives inside the per-input
 * `switchMap`, an error from `fetchFn(input)` does NOT complete the outer inputs subscription:
 * the next input emission (or a `resetter` emission) re-runs `fetchFn` and recovers automatically.
 *
 * Mirrors `mapToFetchState`'s "never fails" contract: errors from the inputs source or the
 * `resetter` are also converted to an error state (rather than propagating to the subscriber),
 * though they do terminate the outer subscription (unlike `fetchFn` errors).
 *
 * Mirrors `mapToFetchState`'s `previousData` carry-over: a fetching state preserves the last
 * `Ready.data` until either a new ready or an error overrides it.
 *
 * Caveat — `previousData` is also carried across distinct input emissions. When the input changes
 * to a different entity, the intermediate fetching state will display the *previous* input's data
 * (a brief stale-data flash). If a component must avoid this, gate inputs upstream (e.g.,
 * `distinctUntilChanged` on a stable identifier) or compare entity ids before rendering.
 */
export function switchMapToFetchState<I, T, U = undefined>(
  fetchFn: (input: I) => Observable<T>,
  config?: { resetter?: Observable<unknown>, identifier?: U },
): OperatorFunction<I, FetchState<T, U>> {
  let previousData: T|undefined;
  const resetter = config?.resetter ? config?.resetter : EMPTY;
  return pipe(
    switchMap((input: I) =>
      resetter.pipe(
        startWith(noop),
        switchMap(() => fetchFn(input).pipe(
          map(data => readyState(data, config?.identifier)),
          catchError(err => of(errorState(err, config?.identifier))),
          // Outer `map` below rewrites this with `previousData`, mirror `mapToFetchState`.
          startWith(fetchingState(undefined, config?.identifier)),
        )),
      ),
    ),
    // Defends against an erroring inputs source or resetter (e.g., a synchronous store-selector
    // throw upstream) so the subscriber sees an error state rather than the raw exception.
    catchError(err => of(errorState(err, config?.identifier))),
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
export function readyData<T, U = undefined>(): OperatorFunction<FetchState<T, U>,T> {
  return pipe(
    filter((s): s is Ready<T, U> => s.isReady),
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
