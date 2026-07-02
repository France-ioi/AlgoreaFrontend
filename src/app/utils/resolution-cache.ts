import { catchError, Observable, of, shareReplay } from 'rxjs';

export interface ResolutionCache<T> {
  get(id: string): Observable<T | null>,
  prefetch(ids: string[]): void,
}

export function createResolutionCache<T>(
  resolve: (id: string) => Observable<T>,
): ResolutionCache<T> {
  const cache = new Map<string, Observable<T | null>>();

  return {
    get(id: string): Observable<T | null> {
      const cached = cache.get(id);
      if (cached) return cached;

      const resolution$ = resolve(id).pipe(
        // Failed lookups are cached as null for the session (no retry) to avoid hammering invisible IDs.
        catchError(() => of(null as T | null)),
        shareReplay(1),
      );
      cache.set(id, resolution$);
      return resolution$;
    },

    prefetch(ids: string[]): void {
      for (const id of ids) {
        this.get(id).subscribe();
      }
    },
  };
}
