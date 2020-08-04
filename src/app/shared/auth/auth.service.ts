import { Injectable } from '@angular/core';
import { catchError, switchMap, pairwise } from 'rxjs/operators';
import { AccessToken } from './access-token';
import { Observable, BehaviorSubject, of, empty } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentAccessToken$: BehaviorSubject<AccessToken|null>;
  state: 'idle'|'fetching'|'refreshing'|'error';

  constructor(
    private oauthService: OAuthService,
    private tempAuth: TempAuthService,
    private authHttp: AuthHttpService
  ) {
    logState('Init the auth service');

    this.state = 'fetching'; // will immediately be changed if we can get a token without fetching
    this.currentAccessToken$ = new BehaviorSubject<AccessToken|null>(AccessToken.fromStorage());

    this.currentAccessToken$.pipe(pairwise()).subscribe((tokens) => this.tokenChanged(tokens));

    // First, check if a code/state is given in URL (i.e., we are back from a oauth login redirect) and try to get a token from it.
    oauthService.tryCompletingCodeFlowLogin().pipe(
      catchError((_e):Observable<AccessToken|null> => of<AccessToken|null>(null)),
      switchMap((newToken) => {
        // If can get a token from these code/state, use this one in priority
        if (newToken !== null) {
          this.currentAccessToken$.next(newToken);
        }
        // If there is a valid token (just set or stored from earlier), use it. Otherwise, create a temp user.
        if (this.currentAccessToken$.value !== null) {
          return empty();
        } else {
          return this.tempAuth.login();
        }
      }),
    ).subscribe({
      next:(tempUserToken: AccessToken) => {
        // temp user token received successfully
        this.currentAccessToken$.next(tempUserToken);
      },
      error:(_e) => {
        // if temp user creation fails, there is not much we can do
        this.state = 'error';
      },
      complete:() => {
        // in any of the success case
        this.state = 'idle';
      }
    });
  }

  accessToken(): Observable<AccessToken|null> {
    return this.currentAccessToken$.asObservable();
  }

  /**
   * Return whether an authenticated user (i.e. non-temp) is connected
   */
  authUserConnected(): boolean {
    const token = this.currentAccessToken$.getValue();
    return token !== null && token.type === 'authenticated';
  }

  /**
   * Start the login workflow (i.e., redirect to login prompt)
   */
  startLogin() {
    logState('startLogin');

    if (!['idle','error'].includes(this.state)) {
      logState('cannot startLogin if state is not idle or error');
      // FIXME more logs (?)
      return;
    }
    if ((this.currentAccessToken$.value || {}).type !== 'temporary') {
      logState('cannot startLogin if an auth user is already connected (unexpected, should logout first)');
      // FIXME more logs (?)
      return;
    }

    this.oauthService.initCodeFlow();
  }

  /**
   * Log the authenticated user out and create a new temp user.
   * (note the token revocation is done by `tokenChanged` when the token is changed)
   */
  logoutAuthUser() {
    logState('logoutAuthUser');

    if (!['idle','error'].includes(this.state)) {
      logState('cannot logoutAuthUser if state is not idle or error');
      // FIXME more logs (?)
      return;
    }
    const currentToken = this.currentAccessToken$.value;
    if ((currentToken || {}).type !== 'authenticated') {
      logState('cannot startLogin if a temp user is already connected (unexpected)');
      // FIXME more logs (?)
      return;
    }

    this.state = 'fetching';
    this.tempAuth.login().subscribe({
      next:(tempUserToken) => {
        logState('temp user token received');
        this.currentAccessToken$.next(tempUserToken);
      },
      error:(_e) => {
        logState('temp user creation failed');
        // if temp user creation fails, there is not much we can do
        this.currentAccessToken$.next(null);
        this.state = 'error';
      },
      complete:() => {
        this.state = 'idle';
      }
    });
  }

  private tokenChanged([oldToken, newToken]: [AccessToken, AccessToken]) {
    logState('token changed');

    if (JSON.stringify(oldToken) === JSON.stringify(newToken)) return;
    if (oldToken !== null && oldToken.isValid()) {
      this.authHttp.revokeToken(oldToken.accessToken).subscribe();
    }
    if (newToken === null) {
      AccessToken.clearFromStorage();
    } else {
      newToken.saveToStorage();
    }
  }

}
