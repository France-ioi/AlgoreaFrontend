import { Injectable, OnDestroy } from '@angular/core';
import { catchError, switchMap, retry, mapTo } from 'rxjs/operators';
import { BehaviorSubject, of, timer, throwError, Subject, EMPTY } from 'rxjs';
import { OAuthService } from './oauth.service';
import { AuthHttpService } from '../http-services/auth.http-service';
import { MINUTES } from '../helpers/duration';
import { appConfig } from '../helpers/config';
import { tokenAuthFromStorage, AuthStatus, notAuthenticated, AuthResult, clearTokenFromStorage } from './auth-info';

// Lifetime under which we refresh the token.
export const minTokenLifetime = 5*MINUTES;

/**
 * This service manages the authentication workflow (login, logout, ...) for authenticated and temp sessions.
 * In this service, we use the following terms:
 * - 'authenticated' session: a precise user who has been authenticated by the auth server, typically (but not only) by username/password.
 * - 'temporary' session: a temp user which has been created on the backend and which will not be persisted.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  status$ = new BehaviorSubject<AuthStatus>(notAuthenticated());
  failure$ = new Subject<void>();

  constructor(
    private oauthService: OAuthService,
    private authHttp: AuthHttpService
  ) {
    // (1) check if a code/state is given in URL (i.e., we are back from a oauth login redirect) and try to get a token from it.
    oauthService.tryCompletingCodeFlowLogin().pipe(
      catchError(_e => {
        // (2) use the ongoing authentication if any
        if (appConfig.useTokens) {
          const token = tokenAuthFromStorage();
          return token ? of(token) : throwError(new Error('no token stored for token auth'));
        } else {
          return this.authHttp.refreshCookie(); // will fail if the browser has no cookie
        }
      }),
      catchError(_e =>
        // (3) otherwise, create a temp session
        this.authHttp.createTempUser().pipe(retry(2))
      ),
    ).subscribe({
      next: (auth: AuthResult) => {
        this.status$.next(auth);
      },
      error: _e => {
        // if temp user creation fails, there is not much we can do
        this.failure$.next();
      }
    });

    // setup auto-refresh after delay
    this.status$.pipe(
      switchMap(auth => {
        const maxDelay = 2147483647;
        if (!auth.authenticated) return EMPTY;
        // Refresh if the token is valid < `minTokenLifetime` or when it will have reached 50% of its lifetime. Retry every minute.
        const refreshIn = auth.expiration.getTime() - Date.now() <= minTokenLifetime ? 0 :
          Math.max((auth.expiration.getTime() + auth.creation.getTime())/2 - Date.now(), 0);
        return timer(Math.min(refreshIn, maxDelay), 1*MINUTES).pipe(mapTo(auth));
      }),
      switchMap(auth =>
        this.authHttp.refreshAuth(auth)
      )
    ).subscribe(auth => {
      this.status$.next(auth);
    });
  }

  ngOnDestroy(): void {
    this.status$.complete();
    this.failure$.complete();
  }

  /**
   * Start the auth session login workflow (i.e., redirect to login prompt)
   */
  startAuthLogin(): void {
    this.oauthService.initCodeFlow();
  }

  /**
   * Log the non-temp user out (redirect to auth website). (new temp user will be recreate when coming back on the app)
   */
  logoutAuthUser(): void {
    const currentauth = this.status$.value;
    if (!currentauth.authenticated) throw new Error('unable to logout while no user is logged in');
    this.status$.next(notAuthenticated());

    if (appConfig.useTokens) clearTokenFromStorage();
    this.authHttp.revokeAuth(currentauth).pipe(
      catchError(_e => of(undefined)), // continue next step even if token revocation failed
    ).subscribe(() => {
      this.oauthService.logoutOnAuthServer();
    });
  }

  /**
   * Called when the API token is invalid (typically by an interceptor) and so that a fallback solution has to be found.
   * The auth arg is what was used with the request that was considered as invalid, so that we can check it is still in use.
   */
  invalidToken(auth: AuthResult): void {
    const currentauth = this.status$.value;
    if (!currentauth.authenticated) return; // not the first time we are not notified of that, ignore.
    if (currentauth.expiration.getDate() !== auth.expiration.getDate()) return; // auth has been renewed in the meantime

    this.status$.next(notAuthenticated());
    this.authHttp.createTempUser().pipe(retry(2)).subscribe({
      next: auth => {
        this.status$.next(auth);
      },
      error: _e => {
        this.failure$.next(); // if temp user creation fails, there is not much we can do
      }
    });

  }

}
