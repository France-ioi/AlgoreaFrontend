import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

const MAX_CONCURRENT = 1;

/**
 * Serialises subscriptions to "work" observables so that, across all callers,
 * at most MAX_CONCURRENT inner observables are subscribed at the same time.
 *
 * Used by the chapter-stats rows to avoid firing dozens of HTTP requests in
 * parallel (which Firefox handles poorly).
 *
 * Cancellation: when the consumer of `enqueue(...)` unsubscribes,
 * - if the work has not started yet, it is removed from the queue (no slot
 *   consumed and no HTTP fired);
 * - if it is in flight, its inner subscription is unsubscribed (cancelling the
 *   HTTP request) and the slot is released so the next queued work can start.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskStatsLoaderService {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  enqueue<T>(work$: Observable<T>): Observable<T> {
    return new Observable<T>(subscriber => {
      let started = false;
      let released = false;
      let innerSub: Subscription | undefined;

      const release = (): void => {
        if (released) return;
        released = true;
        this.active--;
        const next = this.waiting.shift();
        if (next) next();
      };

      const start = (): void => {
        started = true;
        this.active++;
        innerSub = work$.subscribe({
          next: value => subscriber.next(value),
          error: err => {
            release();
            subscriber.error(err);
          },
          complete: () => {
            release();
            subscriber.complete();
          },
        });
      };

      if (this.active < MAX_CONCURRENT) {
        start();
      } else {
        this.waiting.push(start);
      }

      return () => {
        if (started) {
          innerSub?.unsubscribe();
          release();
        } else {
          const idx = this.waiting.indexOf(start);
          if (idx >= 0) this.waiting.splice(idx, 1);
        }
      };
    });
  }
}
