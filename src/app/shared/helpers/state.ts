import { of, OperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Ready<T> { readonly tag: 'ready', readonly data: T }
export interface Fetching { readonly tag: 'fetching' }
export interface FetchError { readonly tag: 'error', readonly error?: any }

export function readyState<T>(data: T): Ready<T> {
  return { tag: 'ready', data: data };
}

export function fetchingState(): Fetching {
  return { tag: 'fetching' };
}

export function errorState(error?: any): FetchError {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { tag: 'error', error: error };
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
