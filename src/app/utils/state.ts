export type FetchState<T, U = undefined> = Ready<T, U>|Fetching<T, U>|FetchError<U>;
export type Ready<T, U = undefined> = Readonly<{
  tag: 'ready',
  isReady: true,
  data: T,
  isFetching: false,
  isError: false,
  error?: undefined,
  identifier?: U,
}>;
export type Fetching<T, U = undefined> = Readonly<{
  tag: 'fetching',
  isReady: false,
  data?: T,
  isFetching: true,
  isError: false,
  error?: undefined,
  identifier?: U,
}>;
export type FetchError<U = undefined> = Readonly<{
  tag: 'error',
  isReady: false,
  data?: undefined,
  isFetching: false,
  isError: true,
  error: unknown,
  identifier?: U,
}>;

export function readyState<T, U = undefined>(data: T, identifier?: U): Ready<T, U> {
  return { tag: 'ready', isReady: true, data: data, isFetching: false, isError: false, identifier };
}

export function fetchingState<T = undefined, U = undefined>(data?: T, identifier?: U): Fetching<T, U> {
  return { tag: 'fetching', isReady: false, data: data, isFetching: true, isError: false, identifier };
}

export function errorState<U = undefined>(error: unknown, identifier?: U): FetchError<U> {
  return { tag: 'error', isReady: false, isFetching: false, isError: true, error: error, identifier };
}

export function isFetchingOrError<T, U = undefined>(state: FetchState<T, U>): state is Fetching<T, U>|FetchError {
  return state.isFetching || state.isError;
}

/**
 * Maps the data (if any) using the `dataMapper` function, otherwise keeps the state unchanged
 */
export function mapStateData<T, V, U = undefined>(state: FetchState<T,U>, dataMapper: (data: T) => V): FetchState<V,U> {
  if (state.isReady) return readyState(dataMapper(state.data), state.identifier);
  if (state.isFetching) return fetchingState(state.data === undefined ? undefined : dataMapper(state.data), state.identifier);
  return state; // error state is not changed
}
