import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { SECONDS } from '../../utils/duration';
import { ExclusiveLock, webLock } from '../../utils/web-lock';
import { AuthResult } from './auth-info';

export const AUTH_SESSION_LOCK = new InjectionToken<ExclusiveLock>('authSessionLock', {
  factory: (): ExclusiveLock => webLock(
    'algorea-auth-session',
    'locks' in navigator ? navigator.locks : undefined,
    // Longer than worst-case holder: longAuthServicesTimeout (6s refresh) + 3× default requestTimeout (6s create).
    // A frozen holder must not leave other tabs unauthenticated forever.
    30 * SECONDS,
  ),
});

type AuthSessionHttp = Pick<AuthHttpService, 'refreshAuth' | 'createTempUser'>;

export function createTempUserWithRetry(http: AuthSessionHttp, lang: string): Observable<AuthResult> {
  return http.createTempUser(lang).pipe(retry(2));
}

export function resumeOrCreateCookieSession(
  http: AuthSessionHttp,
  lock: ExclusiveLock,
  lang: string,
): Observable<AuthResult> {
  return lock(() => http.refreshAuth({
    createTempUserOnRefreshFailure: true,
    tempUserDefaultLanguage: lang,
  }).pipe(catchError(() => createTempUserWithRetry(http, lang))));
}
