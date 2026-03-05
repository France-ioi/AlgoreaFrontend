import { DestroyRef, inject, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { isNotNull } from './null-undefined-predicates';
import { FetchState } from './state';
import { mapToFetchState } from './operators/state';

interface FetchListResult<T> { state: Signal<FetchState<T> | undefined>, refresh: () => void }

function makeFetchListResult<P, T>(
  params: Signal<P | null>,
  fetcher: (p: P) => Observable<T>,
): FetchListResult<T> {
  const destroyRef = inject(DestroyRef);
  const refresh$ = new Subject<void>();

  destroyRef.onDestroy(() => refresh$.complete());

  const state = toSignal(
    toObservable(params).pipe(
      filter(isNotNull),
      switchMap(p => fetcher(p).pipe(
        mapToFetchState({ resetter: refresh$ }),
      )),
    ),
  );

  return { state, refresh: () => refresh$.next() };
}

/**
 * Creates a refreshable fetch state signal that always fetches immediately.
 *
 * - Emits fetching/ready/error states via `mapToFetchState`.
 * - The returned `refresh` function re-triggers the fetch.
 *
 * Must be called during construction (requires injection context for `toSignal`/`toObservable`).
 *
 * For a params-driven variant that can skip fetching when params are null, use `fetchListFromParams`.
 */
export function fetchList<T>(
  fetcher: () => Observable<T>,
): FetchListResult<T> {
  return makeFetchListResult(signal({}), () => fetcher());
}

/**
 * Creates a refreshable fetch state signal driven by a params signal.
 *
 * - Ignores `null` params (fetch is skipped when the signal is null).
 * - Emits fetching/ready/error states via `mapToFetchState`.
 * - The returned `refresh` function re-triggers the fetch.
 *
 * Must be called during construction (requires injection context for `toSignal`/`toObservable`).
 *
 * For a param-less variant that always fetches, use `fetchList`.
 */
export function fetchListFromParams<P, T>(
  params: Signal<P | null>,
  fetcher: (p: P) => Observable<T>,
): FetchListResult<T> {
  return makeFetchListResult(params, fetcher);
}
