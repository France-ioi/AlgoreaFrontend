
export type FetchState<T> = Ready<T>|Fetching|FetchError;
export type Ready<T> = Readonly<{ tag: 'ready', isReady: true, data: T, isFetching: false, isError: false, error?: undefined }>;
export type Fetching = Readonly<{ tag: 'fetching', isReady: false, data?: undefined, isFetching: true, isError: false, error?: undefined }>;
export type FetchError = Readonly<{ tag: 'error', isReady: false, data?: undefined, isFetching: false, isError: true, error: Error }>;

export function readyState<T>(data: T): Ready<T> {
  return { tag: 'ready', isReady: true, data: data, isFetching: false, isError: false };
}

export function fetchingState(): Fetching {
  return { tag: 'fetching', isReady: false, isFetching: true, isError: false };
}

export function errorState(error: Error): FetchError {
  return { tag: 'error', isReady: false, isFetching: false, isError: true, error: error };
}
