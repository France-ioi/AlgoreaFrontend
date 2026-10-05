import { TestBed } from '@angular/core/testing';
import { APPCONFIG } from 'src/app/config';

import { AuthService, maxInvalidToken } from './auth.service';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { LocaleService } from 'src/app/services/localeService';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AUTH_SESSION_LOCK } from './cookie-session';
import { ExclusiveLock } from '../../utils/web-lock';
import {
  cookieAuthFromServiceResp,
  cookieAuthenticated,
  tokenAuthFromServiceResp,
  clearTokenFromStorage,
  notAuthenticated,
} from './auth-info';

describe('AuthService', () => {
  let authService: AuthService;
  let sessionLock: jasmine.Spy<ExclusiveLock>;
  let refreshAuth: jasmine.Spy;
  let createTempUser: jasmine.Spy;

  const passthroughLock: ExclusiveLock = <T>(work: () => Observable<T>): Observable<T> => work();

  function holdingLock(): { lock: ExclusiveLock, release: () => void } {
    const gate = new Subject<void>();
    return {
      lock: <T>(work: () => Observable<T>): Observable<T> => gate.pipe(take(1), switchMap(() => work())),
      release: (): void => {
        gate.next();
      },
    };
  }

  function configure(options: {
    authType?: 'cookies' | 'tokens',
    refreshAuth?: jasmine.Spy,
    createTempUser?: jasmine.Spy,
    lock?: ExclusiveLock,
  } = {}): void {
    sessionLock = jasmine.createSpy('sessionLock').and.callFake(options.lock ?? passthroughLock);
    refreshAuth = options.refreshAuth ?? jasmine.createSpy('refreshAuth').and.returnValue(EMPTY);
    createTempUser = options.createTempUser ?? jasmine.createSpy('createTempUser').and.returnValue(EMPTY);

    TestBed.configureTestingModule({
      providers: [
        { provide: APPCONFIG, useValue: { apiUrl: 'http://localhost:3000/api', authType: options.authType ?? 'cookies' } },
        { provide: AUTH_SESSION_LOCK, useValue: sessionLock },
        {
          provide: AuthHttpService,
          useValue: {
            refreshAuth,
            createTempUser,
          }
        },
        {
          provide: LocaleService,
          useValue: {
            currentLang: { tag: 'fr' }
          }
        }
      ]
    });
    authService = TestBed.inject(AuthService);
  }

  afterEach(() => {
    authService.ngOnDestroy();
    clearTokenFromStorage();
  });

  it('should be created', () => {
    configure();
    expect(authService).toBeTruthy();
  });

  it('uses the session lock and refreshAuth with the create flag on cookie-mode startup', () => {
    const held = holdingLock();
    const auth = cookieAuthFromServiceResp(3600);
    configure({
      lock: held.lock,
      refreshAuth: jasmine.createSpy('refreshAuth').and.returnValue(of(auth)),
    });

    expect(sessionLock).toHaveBeenCalled();
    expect(refreshAuth).not.toHaveBeenCalled();
    held.release();
    expect(refreshAuth).toHaveBeenCalledWith({
      createTempUserOnRefreshFailure: true,
      tempUserDefaultLanguage: 'fr',
    });
    expect(createTempUser).not.toHaveBeenCalled();
    expect(authService.status$.value).toEqual(auth);
  });

  it('recovers cookie-mode invalidToken through the lock and refreshAuth, without createTempUser', () => {
    const startupAuth = cookieAuthFromServiceResp(3600);
    const recoveredAuth = cookieAuthFromServiceResp(4000);
    configure({
      refreshAuth: jasmine.createSpy('refreshAuth').and.returnValues(of(startupAuth), of(recoveredAuth)),
    });

    const held = holdingLock();
    sessionLock.and.callFake(held.lock);
    sessionLock.calls.reset();
    refreshAuth.calls.reset();
    createTempUser.calls.reset();

    authService.invalidToken(startupAuth);
    expect(sessionLock).toHaveBeenCalled();
    expect(refreshAuth).not.toHaveBeenCalled();
    held.release();
    expect(refreshAuth).toHaveBeenCalledWith({
      createTempUserOnRefreshFailure: true,
      tempUserDefaultLanguage: 'fr',
    });
    expect(createTempUser).not.toHaveBeenCalled();
    expect(authService.status$.value).toEqual(recoveredAuth);
  });

  it('falls back to createTempUser when cookie-mode invalidToken refreshAuth errors', () => {
    const startupAuth = cookieAuthFromServiceResp(3600);
    const createdAuth = cookieAuthFromServiceResp(4000);
    configure({
      refreshAuth: jasmine.createSpy('refreshAuth').and.returnValues(
        of(startupAuth),
        throwError(() => new Error('refresh failed')),
      ),
      createTempUser: jasmine.createSpy('createTempUser').and.returnValue(of(createdAuth)),
    });

    authService.invalidToken(startupAuth);

    expect(createTempUser).toHaveBeenCalledWith('fr');
    expect(authService.status$.value).toEqual(createdAuth);
  });

  it('calls createTempUser directly on token-mode invalidToken and never uses the lock', () => {
    // Seeds sessionStorage so constructor restore authenticates; otherwise invalidToken returns early.
    const createdAuth = tokenAuthFromServiceResp('tok', 3600);
    configure({
      authType: 'tokens',
      createTempUser: jasmine.createSpy('createTempUser').and.returnValue(of(createdAuth)),
    });

    sessionLock.calls.reset();
    createTempUser.calls.reset();

    const current = authService.status$.value;
    expect(current.authenticated).toBeTrue();
    if (current.authenticated) authService.invalidToken(current);

    expect(sessionLock).not.toHaveBeenCalled();
    expect(createTempUser).toHaveBeenCalledWith('fr');
    expect(refreshAuth).not.toHaveBeenCalled();
    expect(authService.status$.value).toEqual(createdAuth);
  });

  it('runs cookie-mode periodic refresh through the lock', () => {
    // Zoneless: no fakeAsync; jasmine.clock advances RxJS timer(0) when expiry is within minTokenLifetime.
    jasmine.clock().install();
    try {
      const auth = cookieAuthFromServiceResp(60);
      configure({
        refreshAuth: jasmine.createSpy('refreshAuth').and.returnValue(of(auth)),
      });
      sessionLock.calls.reset();
      refreshAuth.calls.reset();

      jasmine.clock().tick(0);

      expect(sessionLock).toHaveBeenCalled();
      expect(refreshAuth).toHaveBeenCalled();
      expect(refreshAuth.calls.mostRecent().args.length).toBe(0);
      authService.ngOnDestroy();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('does not use the lock for token-mode periodic refresh', () => {
    jasmine.clock().install();
    try {
      const auth = tokenAuthFromServiceResp('tok', 60);
      configure({
        authType: 'tokens',
        refreshAuth: jasmine.createSpy('refreshAuth').and.returnValue(of(auth)),
      });
      sessionLock.calls.reset();
      refreshAuth.calls.reset();

      jasmine.clock().tick(0);

      expect(sessionLock).not.toHaveBeenCalled();
      expect(refreshAuth).toHaveBeenCalled();
      authService.ngOnDestroy();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ignores a late 401 after cookie-mode renewal even when both expire the same day', () => {
    const noonTomorrow = new Date();
    noonTomorrow.setDate(noonTomorrow.getDate() + 1);
    noonTomorrow.setHours(12, 0, 0, 0);
    const authA = cookieAuthenticated(noonTomorrow);
    const authB = cookieAuthenticated(new Date(noonTomorrow.getTime() + 60_000));
    configure({
      refreshAuth: jasmine.createSpy('refreshAuth').and.returnValues(of(authA), of(authB)),
    });

    authService.invalidToken(authA);
    expect(authService.status$.value).toBe(authB);

    sessionLock.calls.reset();
    refreshAuth.calls.reset();
    createTempUser.calls.reset();

    authService.invalidToken(authA);
    expect(refreshAuth).not.toHaveBeenCalled();
    expect(createTempUser).not.toHaveBeenCalled();
    expect(sessionLock).not.toHaveBeenCalled();
    expect(authService.status$.value).toBe(authB);
  });

  it('ignores a distinct AuthResult object that has an identical expiration', () => {
    const expiration = new Date(Date.now() + 3_600_000);
    const current = cookieAuthenticated(expiration);
    configure({
      refreshAuth: jasmine.createSpy('refreshAuth').and.returnValue(of(current)),
    });
    sessionLock.calls.reset();
    refreshAuth.calls.reset();
    createTempUser.calls.reset();

    authService.invalidToken({ ...current });
    expect(refreshAuth).not.toHaveBeenCalled();
    expect(createTempUser).not.toHaveBeenCalled();
    expect(sessionLock).not.toHaveBeenCalled();
    expect(authService.status$.value).toBe(current);
  });

  it('does nothing on invalidToken while not authenticated', () => {
    configure();
    const statusBefore = authService.status$.value;
    expect(statusBefore).toEqual(notAuthenticated());

    sessionLock.calls.reset();
    refreshAuth.calls.reset();
    createTempUser.calls.reset();

    authService.invalidToken(cookieAuthenticated(new Date(Date.now() + 3_600_000)));
    expect(refreshAuth).not.toHaveBeenCalled();
    expect(createTempUser).not.toHaveBeenCalled();
    expect(sessionLock).not.toHaveBeenCalled();
    expect(authService.status$.value).toBe(statusBefore);
  });

  it('raises a failure after more than maxInvalidToken invalidations', () => {
    configure({
      refreshAuth: jasmine.createSpy('refreshAuth').and.callFake(() => of(cookieAuthFromServiceResp(3600))),
    });
    sessionLock.calls.reset();
    refreshAuth.calls.reset();
    createTempUser.calls.reset();

    let failure: Error | undefined;
    authService.failure$.subscribe(err => {
      failure = err;
    });

    for (let i = 0; i < maxInvalidToken + 1; i++) {
      const current = authService.status$.value;
      if (current.authenticated) authService.invalidToken(current);
    }

    expect(refreshAuth).toHaveBeenCalledTimes(maxInvalidToken);
    expect(failure?.message).toBe('too many invalid token');
    expect(authService.status$.value).toEqual(notAuthenticated());
  });
});
