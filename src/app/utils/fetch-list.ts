import { DestroyRef, inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { isNotNull } from './null-undefined-predicates';
import { FetchState } from './state';
import { mapToFetchState } from './operators/state';

/**
 * Creates a refreshable fetch state signal driven by a signal.
 *
 * Converts a `Signal<P | null>` into a `Signal<FetchState<T> | undefined>`:
 * - Ignores `null` params (fetch is skipped when the signal is null).
 * - Emits fetching/ready/error states via `mapToFetchState`.
 * - The returned `refresh` function re-triggers the fetch.
 * - The internal Subject is completed on destroy (via `DestroyRef`).
 *
 * Must be called during construction (requires injection context for `toSignal`/`toObservable`).
 */
export function fetchList<P, T>(
  params: Signal<P | null>,
  fetcher: (p: P) => Observable<T>,
): { state: Signal<FetchState<T> | undefined>, refresh: () => void } {
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
