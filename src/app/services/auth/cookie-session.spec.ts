import { concatMap, EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ExclusiveLock } from '../../utils/web-lock';
import { cookieAuthFromServiceResp } from './auth-info';
import { resumeOrCreateCookieSession } from './cookie-session';

function queuedLock(): ExclusiveLock {
  const queue = new Subject<() => Observable<unknown>>();
  queue.pipe(concatMap(start => start().pipe(catchError(() => EMPTY)))).subscribe();
  return <T>(work: () => Observable<T>): Observable<T> =>
    new Observable<T>(subscriber => {
      queue.next(() => work().pipe(tap({
        next: (value): void => subscriber.next(value),
        error: (err: unknown): void => subscriber.error(err),
        complete: (): void => subscriber.complete(),
      })));
    });
}

describe('resumeOrCreateCookieSession', () => {
  const lang = 'fr';
  const refreshOpts = { createTempUserOnRefreshFailure: true, tempUserDefaultLanguage: lang };

  it('lets tab B refresh only after tab A finishes, without creating a temp user', () => {
    const lock = queuedLock();
    const holdA = new Subject<ReturnType<typeof cookieAuthFromServiceResp>>();
    const refreshAuth = jasmine.createSpy('refreshAuth').and.callFake(() => {
      if (refreshAuth.calls.count() === 1) return holdA.asObservable();
      return of(cookieAuthFromServiceResp(3600));
    });
    const createTempUser = jasmine.createSpy('createTempUser');
    const http = { refreshAuth, createTempUser };

    const fromA: unknown[] = [];
    const fromB: unknown[] = [];
    resumeOrCreateCookieSession(http, lock, lang).subscribe(value => fromA.push(value));
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(refreshAuth).toHaveBeenCalledWith(refreshOpts);

    resumeOrCreateCookieSession(http, lock, lang).subscribe(value => fromB.push(value));
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(createTempUser).not.toHaveBeenCalled();

    holdA.next(cookieAuthFromServiceResp(3600));
    holdA.complete();

    expect(refreshAuth).toHaveBeenCalledTimes(2);
    expect(refreshAuth.calls.mostRecent().args).toEqual([ refreshOpts ]);
    expect(createTempUser).not.toHaveBeenCalled();
    expect(fromA.length).toBe(1);
    expect(fromB.length).toBe(1);
  });

  it('keeps tab B waiting while tab A retries createTempUser inside the lock', () => {
    const lock = queuedLock();
    const holdCreate = new Subject<ReturnType<typeof cookieAuthFromServiceResp>>();
    let createAttempts = 0;
    const refreshAuth = jasmine.createSpy('refreshAuth').and.callFake(() => {
      if (refreshAuth.calls.count() === 1) return throwError(() => new Error('refresh failed'));
      return of(cookieAuthFromServiceResp(3600));
    });
    const createTempUser = jasmine.createSpy('createTempUser').and.callFake(() =>
      new Observable<ReturnType<typeof cookieAuthFromServiceResp>>(subscriber => {
        createAttempts++;
        if (createAttempts < 3) {
          subscriber.error(new Error('create failed'));
          return;
        }
        return holdCreate.subscribe(subscriber);
      })
    );
    const http = { refreshAuth, createTempUser };

    const fromB: unknown[] = [];
    resumeOrCreateCookieSession(http, lock, lang).subscribe();
    resumeOrCreateCookieSession(http, lock, lang).subscribe(value => fromB.push(value));

    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(createTempUser).toHaveBeenCalledTimes(1);
    expect(createTempUser).toHaveBeenCalledWith(lang);
    expect(createAttempts).toBe(3);

    holdCreate.next(cookieAuthFromServiceResp(3600));
    holdCreate.complete();

    expect(refreshAuth).toHaveBeenCalledTimes(2);
    expect(refreshAuth.calls.mostRecent().args).toEqual([ refreshOpts ]);
    expect(createTempUser).toHaveBeenCalledTimes(1);
    expect(fromB.length).toBe(1);
  });

  it('releases the lock after an error so tab B still proceeds', () => {
    const lock = queuedLock();
    const refreshAuth = jasmine.createSpy('refreshAuth').and.callFake(() => {
      if (refreshAuth.calls.count() === 1) return throwError(() => new Error('refresh failed'));
      return of(cookieAuthFromServiceResp(3600));
    });
    const createTempUser = jasmine.createSpy('createTempUser').and.returnValue(throwError(() => new Error('create failed')));
    const http = { refreshAuth, createTempUser };

    const fromB: unknown[] = [];
    resumeOrCreateCookieSession(http, lock, lang).subscribe({ error: (): void => undefined });
    resumeOrCreateCookieSession(http, lock, lang).subscribe(value => fromB.push(value));

    expect(refreshAuth).toHaveBeenCalledTimes(2);
    expect(fromB.length).toBe(1);
  });
});
