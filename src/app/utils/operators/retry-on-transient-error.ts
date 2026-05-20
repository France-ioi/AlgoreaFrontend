import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, TimeoutError, retry, timer } from 'rxjs';

const DEFAULT_DELAYS_MS = [ 200, 1000, 5000 ];

export interface RetryOnTransientErrorConfig {
  /** Maximum number of retry attempts. Defaults to the length of `delaysMs`. */
  count?: number,
  /**
   * Delays (in ms) applied between attempts, indexed by retry number (1-based).
   * If the retry index exceeds the array length, the last delay is reused.
   */
  delaysMs?: number[],
}

/**
 * Retries the source observable on transient failures with bounded exponential backoff.
 *
 * Transient failures are:
 *  - `HttpErrorResponse` with `status === 0` (network/CORS/aborted) or `status >= 500` (server),
 *  - `TimeoutError` from RxJS.
 *
 * 4xx responses are NEVER retried: they represent deliberate backend signals (auth, permission,
 * not-found, validation) and retrying them would mask real problems.
 *
 * Defaults: 3 retries with delays 200ms, 1000ms, 5000ms. Worst-case wall-clock budget ~6.2s.
 *
 * `resetOnSuccess: true` ensures a long-lived observable that recovers and later fails again gets
 * a fresh retry budget.
 */
export function retryOnTransientError<T>(config?: RetryOnTransientErrorConfig): MonoTypeOperatorFunction<T> {
  const delays = config?.delaysMs ?? DEFAULT_DELAYS_MS;
  const count = config?.count ?? delays.length;
  return retry({
    count,
    delay: (error, retryIndex) => {
      if (!isTransientError(error)) throw error;
      const ms = delays[Math.min(retryIndex - 1, delays.length - 1)] ?? 0;
      return timer(ms);
    },
    resetOnSuccess: true,
  });
}

function isTransientError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof HttpErrorResponse) return error.status === 0 || error.status >= 500;
  return false;
}
