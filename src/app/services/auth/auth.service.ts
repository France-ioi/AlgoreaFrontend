import { Injectable, OnDestroy, inject } from '@angular/core';
import { catchError, switchMap, retry, map } from 'rxjs/operators';
import { BehaviorSubject, of, timer, Subject, EMPTY, TimeoutError } from 'rxjs';
import { OAuthService } from './oauth.service';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { MINUTES } from '../../utils/duration';
import { APPCONFIG } from '../../config';
import {
  tokenAuthFromStorage,
  AuthStatus,
  notAuthenticated,
  AuthResult,
  clearTokenFromStorage,
  hasForcedToken,
  forcedTokenAuthFromStorage
} from './auth-info';
import { LocaleService } from '../../services/localeService';
import { HttpErrorResponse } from '@angular/common/http';

// Lifetime under which we refresh the token.
export const minTokenLifetime = 5*MINUTES;

// max number of invalid token (401) for which we try to get a new token.
// (useful to prevent infinite loop of requesting a new token -> token does not work  -> requesting a new token --> ...)
export const maxInvalidToken = 6;

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
  private oauthService = inject(OAuthService);
  private authHttp = inject(AuthHttpService);
  private localeService = inject(LocaleService);
  private config = inject(APPCONFIG);

  status$ = new BehaviorSubject<AuthStatus>(notAuthenticated());
  failure$ = new Subject<Error>();

  private countInvalidToken = 0;

  authSubscription = this.oauthService
    // (1) check if a code/state is given in URL (i.e., we are back from a oauth login redirect) and try to get a token from it.
    .tryCompletingCodeFlowLogin().pipe(
      catchError(_e => {
        // (2) use the ongoing authentication if any
        if (this.config.allowForcedToken && hasForcedToken()) return of(forcedTokenAuthFromStorage());
        else if (this.config.authType === 'tokens') return of(tokenAuthFromStorage());
        else {
          // try to refresh the cookie-stored token
          // there may not be any (valid) token (we cannot know)... in such a case the service create a temp user (using the given language)
          const defaultLanguage = this.localeService.currentLang?.tag;
          if (!defaultLanguage) throw new Error('default language should be defined');
          return this.authHttp.refreshAuth({ createTempUserOnRefreshFailure: true, tempUserDefaultLanguage: defaultLanguage });
        }
      }),
      catchError(_e => {
        // (3) otherwise, create a temp session
        const defaultLanguage = this.localeService.currentLang?.tag;
        // If no default language, the app is in error state, no need to create a temp user.
        if (!defaultLanguage) throw new Error('default language should be defined');
        return this.authHttp.createTempUser(defaultLanguage).pipe(retry(2));
      }),
    ).subscribe({
      next: (auth: AuthResult) => {
        this.status$.next(auth);
      },
      error: err => {
        // if temp user creation fails, there is not much we can do
        this.failure$.next(new Error('temp user creation failed (1)'));
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });

  // auto-refresh after delay
  autoRefreshSubscription = this.status$.pipe(
    switchMap(auth => {
      // Max delay for Rx.timer. Otherwise, it triggers immediately (see bug https://github.com/ReactiveX/rxjs/issues/3015)
      const maxDelay = 2147483647; // 2^31-1
      if (!auth.authenticated) return EMPTY;
      // Refresh if the token is valid < `minTokenLifetime` or when it will have reached 50% of its lifetime. Retry every minute.
      const refreshIn = auth.expiration.getTime() - Date.now() <= minTokenLifetime ? 0 :
        Math.max((auth.expiration.getTime() + auth.creation.getTime())/2 - Date.now(), 0);
      return timer(Math.min(refreshIn, maxDelay), 1*MINUTES).pipe(map(() => auth));
    }),
    switchMap(auth => {
      const isExpired = auth.expiration.valueOf() < Date.now();
      if (isExpired) return of({ auth, tokenIsExpired: true }); // don't even try to refresh the token if it is expired
      return this.authHttp.refreshAuth().pipe(
        catchError(err => {
          // For any http error, ignore it since the token is valid. Another try will occur the next minute.
          if (err instanceof HttpErrorResponse || err instanceof TimeoutError) return EMPTY;
          else throw err; // rethrow any JS error to let our error monitor catch it.
        }),
        map(auth => ({ auth, tokenIsExpired: false })),
      );
    })
  ).subscribe(result => {
    if (result.tokenIsExpired) this.invalidToken(result.auth);
    else this.status$.next(result.auth);
  });

  ngOnDestroy(): void {
    this.status$.complete();
    this.failure$.complete();
    this.authSubscription.unsubscribe();
    this.autoRefreshSubscription.unsubscribe();
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

    this.authHttp.revokeAuth().pipe(
      catchError(_e => of(undefined)), // continue next step even if token revocation failed
    ).subscribe(() => {
      this.oauthService.logoutOnAuthServer();
    });

    this.status$.next(notAuthenticated());
    if (this.config.authType === 'tokens') clearTokenFromStorage();
  }

  /**
   * Called when the API token is invalid (typically by an interceptor) and so that a fallback solution has to be found.
   * The auth arg is what was used with the request that was considered as invalid, so that we can check it is still in use.
   */
  invalidToken(auth: AuthResult): void {
    const currentauth = this.status$.value;
    if (!currentauth.authenticated) return; // not the first time we are not notified of that, ignore.
    if (currentauth.expiration.getDate() !== auth.expiration.getDate()) return; // auth has been renewed in the meantime

    this.countInvalidToken ++;
    this.status$.next(notAuthenticated());
    if (this.countInvalidToken > maxInvalidToken) {
      this.failure$.next(new Error('too many invalid token'));
      return;
    }

    const defaultLanguage = this.localeService.currentLang?.tag;
    // If no default language, the app is in error state, no need to create a temp user.
    if (!defaultLanguage) throw new Error('default language should be defined');

    this.authHttp.createTempUser(defaultLanguage).pipe(retry(2)).subscribe({
      next: auth => {
        this.status$.next(auth);
      },
      error: _e => {
        this.failure$.next(new Error('temp user creation failed (2)')); // if temp user creation fails, there is not much we can do
      }
    });

  }

}
