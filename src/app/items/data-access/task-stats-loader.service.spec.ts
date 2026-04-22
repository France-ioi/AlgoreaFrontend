import { Observable, Subject } from 'rxjs';
import { TaskStatsLoaderService } from './task-stats-loader.service';

interface TrackedWork<T> {
  source$: Subject<T>,
  subscriptions: number,
  unsubscribed: boolean,
}

function trackedWork<T>(): { work$: Observable<T>, tracker: TrackedWork<T> } {
  const source$ = new Subject<T>();
  const tracker: TrackedWork<T> = { source$, subscriptions: 0, unsubscribed: false };
  const work$ = new Observable<T>(subscriber => {
    tracker.subscriptions++;
    const sub = source$.subscribe(subscriber);
    return () => {
      tracker.unsubscribed = true;
      sub.unsubscribe();
    };
  });
  return { work$, tracker };
}

describe('TaskStatsLoaderService', () => {
  let service: TaskStatsLoaderService;

  beforeEach(() => {
    service = new TaskStatsLoaderService();
  });

  it('runs two enqueued works in order (the second is only subscribed after the first completes)', () => {
    const a = trackedWork<string>();
    const b = trackedWork<string>();

    const aValues: string[] = [];
    const bValues: string[] = [];
    let aCompleted = false;
    let bCompleted = false;

    service.enqueue(a.work$).subscribe({
      next: v => aValues.push(v),
      complete: () => {
        aCompleted = true;
      },
    });
    service.enqueue(b.work$).subscribe({
      next: v => bValues.push(v),
      complete: () => {
        bCompleted = true;
      },
    });

    expect(a.tracker.subscriptions).toBe(1);
    expect(b.tracker.subscriptions).toBe(0);

    a.tracker.source$.next('a1');
    expect(aValues).toEqual([ 'a1' ]);
    expect(b.tracker.subscriptions).toBe(0);

    a.tracker.source$.complete();
    expect(aCompleted).toBe(true);
    expect(b.tracker.subscriptions).toBe(1);

    b.tracker.source$.next('b1');
    b.tracker.source$.complete();
    expect(bValues).toEqual([ 'b1' ]);
    expect(bCompleted).toBe(true);
  });

  it('removes a queued (not-yet-started) work from the queue when its consumer unsubscribes, without consuming a slot', () => {
    const a = trackedWork<string>();
    const b = trackedWork<string>();
    const c = trackedWork<string>();

    service.enqueue(a.work$).subscribe();
    const bSub = service.enqueue(b.work$).subscribe();
    service.enqueue(c.work$).subscribe();

    expect(a.tracker.subscriptions).toBe(1);
    expect(b.tracker.subscriptions).toBe(0);
    expect(c.tracker.subscriptions).toBe(0);

    bSub.unsubscribe();

    a.tracker.source$.complete();
    expect(b.tracker.subscriptions).toBe(0);
    expect(c.tracker.subscriptions).toBe(1);
  });

  it('frees the slot when the active work is unsubscribed and starts the next one', () => {
    const a = trackedWork<string>();
    const b = trackedWork<string>();

    const aSub = service.enqueue(a.work$).subscribe();
    service.enqueue(b.work$).subscribe();

    expect(a.tracker.subscriptions).toBe(1);
    expect(b.tracker.subscriptions).toBe(0);

    aSub.unsubscribe();

    expect(a.tracker.unsubscribed).toBe(true);
    expect(b.tracker.subscriptions).toBe(1);
  });

  it('frees the slot when the active work errors and starts the next one', () => {
    const a = trackedWork<string>();
    const b = trackedWork<string>();

    let aError: unknown;
    service.enqueue(a.work$).subscribe({
      error: e => {
        aError = e;
      },
    });
    service.enqueue(b.work$).subscribe();

    expect(b.tracker.subscriptions).toBe(0);

    a.tracker.source$.error(new Error('boom'));

    expect(aError).toEqual(new Error('boom'));
    expect(b.tracker.subscriptions).toBe(1);
  });
});
