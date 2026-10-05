import { Observable, of, Subject, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { webLock } from './web-lock';

function uniqueLockName(): string {
  return `algorea-web-lock-spec-${ Date.now() }-${ Math.random().toString(36).slice(2) }`;
}

describe('webLock', () => {
  it('runs two concurrent calls one after the other', (done: DoneFn) => {
    const lock = webLock(uniqueLockName(), navigator.locks, 5000);
    const order: string[] = [];
    const holdA = new Subject<void>();

    lock(() => {
      order.push('a-start');
      return holdA.pipe(map(() => 'a'));
    }).subscribe(value => order.push(`a-${ value }`));

    lock(() => {
      order.push('b-start');
      return of('b');
    }).subscribe(value => {
      order.push(`b-${ value }`);
      expect(order).toEqual([ 'a-start', 'a-a', 'b-start', 'b-b' ]);
      done();
    });

    setTimeout(() => {
      expect(order).toEqual([ 'a-start' ]);
      holdA.next();
      holdA.complete();
    }, 50);
  });

  it('never runs work for a waiter that unsubscribes', (done: DoneFn) => {
    const lock = webLock(uniqueLockName(), navigator.locks, 5000);
    const holdA = new Subject<void>();
    const workB = jasmine.createSpy('workB').and.returnValue(of('b'));

    lock(() => holdA.pipe(map(() => 'a'))).subscribe();
    const waiter = lock(workB).subscribe();

    setTimeout(() => {
      waiter.unsubscribe();
      holdA.next();
      holdA.complete();
      setTimeout(() => {
        expect(workB).not.toHaveBeenCalled();
        done();
      }, 50);
    }, 50);
  });

  it('releases the lock to the next caller when the holder unsubscribes', (done: DoneFn) => {
    const lock = webLock(uniqueLockName(), navigator.locks, 5000);
    const holdA = new Subject<never>();
    const holder = lock(() => holdA.asObservable()).subscribe();

    lock(() => of('b')).subscribe(value => {
      expect(value).toBe('b');
      done();
    });

    setTimeout(() => holder.unsubscribe(), 50);
  });

  it('releases the lock on error and forwards it to the subscriber', (done: DoneFn) => {
    const lock = webLock(uniqueLockName(), navigator.locks, 5000);
    const boom = new Error('boom');
    let sawError = false;

    lock(() => throwError(() => boom)).subscribe({
      error: (err: unknown) => {
        expect(err).toBe(boom);
        sawError = true;
      },
    });

    lock(() => of('b')).subscribe(value => {
      expect(sawError).toBeTrue();
      expect(value).toBe('b');
      done();
    });
  });

  it('runs work immediately when LockManager is undefined', () => {
    const lock = webLock('unused', undefined, 1000);
    const work: () => Observable<number> = jasmine.createSpy('work').and.returnValue(of(1));
    const values: number[] = [];

    lock(work).subscribe(value => values.push(value));

    expect(work).toHaveBeenCalledTimes(1);
    expect(values).toEqual([ 1 ]);
  });

  it('runs work without the lock when request rejects', (done: DoneFn) => {
    const locks = {
      request: (): Promise<never> => Promise.reject(new Error('SecurityError')),
    } as unknown as LockManager;
    const work: () => Observable<number> = jasmine.createSpy('work').and.returnValue(of(1));

    webLock('unused', locks, 5000)(work).subscribe(value => {
      expect(value).toBe(1);
      expect(work).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('runs work without the lock after maxWaitMs', (done: DoneFn) => {
    const name = uniqueLockName();
    const holderKeepAlive = new Subject<void>();
    let granted = false;

    void navigator.locks.request(name, () => {
      granted = true;
      return new Promise<void>(release => {
        holderKeepAlive.subscribe({ complete: (): void => release() });
      });
    });

    const waitUntilGranted = (): void => {
      if (!granted) {
        setTimeout(waitUntilGranted, 0);
        return;
      }
      const work: () => Observable<string> = jasmine.createSpy('work').and.returnValue(of('without-lock'));
      webLock(name, navigator.locks, 40)(work).subscribe(value => {
        expect(value).toBe('without-lock');
        expect(work).toHaveBeenCalledTimes(1);
        holderKeepAlive.complete();
        setTimeout(() => {
          expect(work).toHaveBeenCalledTimes(1);
          done();
        }, 50);
      });
    };
    waitUntilGranted();
  });
});
