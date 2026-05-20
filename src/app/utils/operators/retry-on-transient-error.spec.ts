import { HttpErrorResponse } from '@angular/common/http';
import { defer, Observable, TimeoutError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { retryOnTransientError } from './retry-on-transient-error';

describe('retryOnTransientError operator', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should not retry on a successful emission', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('-a|');
      expectObservable(source.pipe(retryOnTransientError())).toBe('-a|');
    });
  });

  it('should retry once on a 503 and then succeed', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error503 = new HttpErrorResponse({ status: 503 });
      // 1st sub errors at frame 1, then 200ms backoff, then 2nd sub emits 'a' at frame 202
      const source = subscriptionFactory([
        () => cold('-#', undefined, error503),
        () => cold('-a|'),
      ]);
      expectObservable(source.pipe(retryOnTransientError())).toBe('- 201ms a|');
    });
  });

  it('should give up after exhausting retries when 503 always returns', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error503 = new HttpErrorResponse({ status: 503 });
      const source = cold('-#', undefined, error503);
      // Errors are at frames 1, 202, 1203, 6204 (last one propagates).
      expectObservable(source.pipe(retryOnTransientError())).toBe('- 6203ms #', undefined, error503);
    });
  });

  it('should not retry on a 403 and propagate the error immediately', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error403 = new HttpErrorResponse({ status: 403 });
      const source = cold('-#', undefined, error403);
      expectObservable(source.pipe(retryOnTransientError())).toBe('-#', undefined, error403);
    });
  });

  it('should retry on a TimeoutError and then succeed', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const timeoutError = new TimeoutError();
      const source = subscriptionFactory([
        () => cold('-#', undefined, timeoutError),
        () => cold('-a|'),
      ]);
      expectObservable(source.pipe(retryOnTransientError())).toBe('- 201ms a|');
    });
  });

  it('should give up on a non-transient error encountered during retry', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error503 = new HttpErrorResponse({ status: 503 });
      const error403 = new HttpErrorResponse({ status: 403 });
      const source = subscriptionFactory([
        () => cold('-#', undefined, error503),
        () => cold('-#', undefined, error403),
      ]);
      // 1st error at frame 1, 200ms backoff, 2nd error (403) at frame 202 -> propagated.
      expectObservable(source.pipe(retryOnTransientError())).toBe('- 201ms #', undefined, error403);
    });
  });
});

/**
 * Builds an Observable whose successive subscriptions are delegated to the provided factories.
 * The Nth subscription invokes the Nth factory; once the list is exhausted the last factory is
 * reused. Used to simulate per-attempt behaviour in retry tests.
 */
function subscriptionFactory<T>(factories: (() => Observable<T>)[]): Observable<T> {
  let index = 0;
  return defer(() => {
    const factory = factories[Math.min(index, factories.length - 1)]!;
    index++;
    return factory();
  });
}
