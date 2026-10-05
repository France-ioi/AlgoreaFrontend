import { defer, Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

export type ExclusiveLock = <T>(work: () => Observable<T>) => Observable<T>;

/**
 * Turns the promise-based `navigator.locks.request` into a cold Observable so callers can stay on RxJS.
 * The lock is held from grant until the inner Observable completes, errors, or is unsubscribed.
 */
export function webLock(name: string, locks: LockManager | undefined, maxWaitMs: number): ExclusiveLock {
  if (!locks) {
    return <T>(work: () => Observable<T>): Observable<T> => defer(work);
  }

  return <T>(work: () => Observable<T>): Observable<T> =>
    new Observable<T>(subscriber => {
      const abort = new AbortController();
      let inner: Subscription | undefined;
      let startedOrAbandoned = false;

      const runWork = (onRelease?: () => void): void => {
        inner = defer(work).pipe(finalize(() => onRelease?.())).subscribe(subscriber);
      };

      const timeoutId = setTimeout(() => {
        if (startedOrAbandoned) return;
        startedOrAbandoned = true;
        abort.abort();
        runWork();
      }, maxWaitMs);

      void locks.request(name, { signal: abort.signal }, () => {
        if (startedOrAbandoned) return;
        startedOrAbandoned = true;
        clearTimeout(timeoutId);
        return new Promise<void>(release => {
          runWork(release);
        });
      }).catch(() => {
        // Broken / unavailable lock manager (SecurityError, TypeError, …): same as no LockManager.
        if (abort.signal.aborted || startedOrAbandoned) return;
        startedOrAbandoned = true;
        clearTimeout(timeoutId);
        runWork();
      });

      return (): void => {
        startedOrAbandoned = true;
        clearTimeout(timeoutId);
        abort.abort();
        inner?.unsubscribe();
      };
    });
}
