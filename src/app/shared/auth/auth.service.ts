import { Injectable, OnDestroy } from '@angular/core';
import { catchError, switchMap, pairwise } from 'rxjs/operators';
import { AccessToken } from './access-token';
import { BehaviorSubject, of, merge, Subscription } from 'rxjs';
import { TempAuthService } from './temp-auth.service';
import { OAuthService } from './oauth.service';
import { AuthHttpService } from '../http-services/auth.http-service';

// as auth can be complex to debug, enable this flag to print state logs
const debugLogEnabled = true;
function logState(msg: string) {
  if (debugLogEnabled) {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
}

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

  private accessToken = new BehaviorSubject<AccessToken|null>(null);
  accessToken$ = this.accessToken.asObservable();
  state: 'idle'|'fetching'|'refreshing'|'error';

  private subscription: Subscription;

  constructor(
    private oauthService: OAuthService,
    private tempAuth: TempAuthService,
    private authHttp: AuthHttpService
  ) {
    logState('Init the auth service');

    this.state = 'fetching'; // will immediately be changed if we can get a token without fetching

    this.subscription = this.accessToken.pipe(pairwise()).subscribe(tokens => this.tokenChanged(tokens));

    // First, check if a code/state is given in URL (i.e., we are back from a oauth login redirect) and try to get a token from it.
    oauthService.tryCompletingCodeFlowLogin().pipe(
      catchError(_e => of<AccessToken|null>(null)),
      switchMap(newToken => {
        const fromStorage = AccessToken.fromStorage();

        // If can get a token from these code/state, use this one in priority
        if (newToken !== null) {
          // if there was a stored token, revoke the token
          if (fromStorage === null) return of(newToken);
          else return merge(
            of(newToken),
            this.authHttp.revokeToken(fromStorage.accessToken).pipe(
              switchMap(() => of<AccessToken>()) // just completing without emitting anything new
            )
          );
        }

        // if there is a valid token in storage, use it
        if (fromStorage !== null) return of(fromStorage);

        // otherwise, create a temp session
        return this.tempAuth.login();
      }),
    ).subscribe({
      next: (token: AccessToken) => {
        this.accessToken.next(token);
      },
      error: _e => {
        // if temp user creation fails, there is not much we can do
        this.state = 'error';
      },
      complete: () => {
        // in any of the success case
        this.state = 'idle';
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Return whether an authenticated user (i.e. non-temp) is connected
   */
  authUserConnected(): boolean {
    return this.accessToken.value?.type === 'authenticated';
  }

  /**
   * Start the auth session login workflow (i.e., redirect to login prompt)
   */
  startAuthLogin() {
    logState('startLogin');
    if (this.isBusy() || this.authUserConnected()) {
      logState(`cannot startLogin if busy or already connected (${this.debugState()})`);
      return;
    }

    this.state = 'fetching';
    this.oauthService.initCodeFlow();
  }

  /**
   * Log the authenticated user out and start a new temp session.
   */
  logoutAuthUser() {
    logState('endAuthSession');
    const currentToken = this.accessToken.value;

    if (this.isBusy() || !currentToken || currentToken.type !== 'authenticated') {
      logState(`cannot endAuthSession if busy or not connected (${this.debugState()})`);
      return;
    }

    this.state = 'fetching';
    this.accessToken.next(null);
    this.authHttp.revokeToken(currentToken.accessToken).pipe(
      catchError(_e => of(null)), // continue next step even if token revocation failed
      switchMap(() => this.tempAuth.login())
    ).subscribe({
      next: token => {
        this.accessToken.next(token);
        this.state = 'idle';
      },
      error: _e => {
        this.state = 'error';
        // temp session creation failed :-/
      }
    });
  }

  /**
   * Called when the API token is invalid (typically by an interceptor) and so that a fallback solution has to be found.
   * The token arg is the token which was used with the request that was considered as invalid, so that a more recent token which has been
   * added in the meantime is not dropped.
   */
  invalidToken(invalidToken: string) {
    const currentToken = this.accessToken.value;
    if (currentToken?.accessToken === invalidToken) {

      // invalidate the current token only if it is the one which is still used now
      this.accessToken.next(null);
      if (this.isBusy()) return;

      if (currentToken.type === 'authenticated') { // user was authenticated
        this.startAuthLogin();
      } else { // user was temporary
        this.state = 'fetching';
        this.tempAuth.login().subscribe({
          next: tempUserToken => {
            logState('temp user token received');
            this.accessToken.next(tempUserToken);
            this.state = 'idle';
          },
          error: _e => {
            logState('temp user creation failed');
            this.state = 'error'; // if temp user creation fails, there is not much we can do
          }
        });
      }
    }
  }

  private tokenChanged([ oldToken, newToken ]: [AccessToken|null, AccessToken|null]) {
    logState('token changed');

    if (JSON.stringify(oldToken) === JSON.stringify(newToken)) return;
    // make sure to replace/clear the token in storage
    if (newToken === null) {
      AccessToken.clearFromStorage();
    } else {
      newToken.saveToStorage();
    }
  }

  private isBusy(): boolean {
    return this.state === 'fetching';
  }

  private debugState(): string {
    const current = this.accessToken.value;
    return (current === null) ? `${this.state},no-token` : `${this.state},${current.type},${current.expiration.toString()}`;
  }

}
