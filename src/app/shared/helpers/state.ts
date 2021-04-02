import { of, OperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type FetchState<T> = Ready<T>|Fetching|FetchError;
export type Ready<T> = Readonly<{ tag: 'ready', isReady: true, data: T, isFetching: false, isError: false, error?: undefined }>
export type Fetching = Readonly<{ tag: 'fetching', isReady: false, data?: undefined, isFetching: true, isError: false, error?: undefined }>
export type FetchError = Readonly<{ tag: 'error', isReady: false, data?: undefined, isFetching: false, isError: true, error: Error }>

export function readyState<T>(data: T): Ready<T> {
  return { tag: 'ready', isReady: true, data: data, isFetching: false, isError: false };
}

export function fetchingState(): Fetching {
  return { tag: 'fetching', isReady: false, isFetching: true, isError: false };
}

export function errorState(error: Error): FetchError {
  return { tag: 'error', isReady: false, isFetching: false, isError: true, error: error };
}

/* Do not use the following 3 functions in templates (!), only for type assertion in TS */

export function isReady<T>(state: {tag: string}): state is Ready<T> {
  return state.tag === 'ready';
}

export function isFetching(state: {tag: string}): state is Fetching {
  return state.tag === 'fetching';
}

export function isError(state: {tag: string}): state is FetchError {
  return state.tag === 'error';
}

export function mapErrorToState<T>(): OperatorFunction<T, T|FetchError> {
  return catchError(e => of(errorState(e)));
}
