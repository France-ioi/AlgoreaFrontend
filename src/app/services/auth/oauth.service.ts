import { Injectable } from '@angular/core';
import { getArgsFromUrl, clearHash } from '../../utils/url';
import { Observable, throwError } from 'rxjs';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { base64UrlEncode } from '../../utils/base64';
import { appConfig } from '../../utils/config';
import { AuthResult } from './auth-info';
import { Location } from '@angular/common';

// Use localStorage for nonce if possible localStorage is the only storage who survives a redirect in ALL browsers (also IE)
const nonceStorage = localStorage;
const nonceStorageKey = 'oauth_nonce';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {

  constructor(
    private authHttp: AuthHttpService,
    private location: Location,
  ) {}

  /**
   * Init authorization code flow login anf redirect the user to the auth server login url.
   */
  initCodeFlow(): void {
    const state = this.createNonce();
    const loginServerUri = appConfig.oauthServerUrl+'/oauth/authorize';
    const separationChar = loginServerUri.indexOf('?') > -1 ? '&' : '?';

    const url = loginServerUri + separationChar + 'response_type=code&scope=account&approval_prompt=auto' +
      '&client_id=' + encodeURIComponent(appConfig.oauthClientId) +
      '&state=' + encodeURIComponent(state) +
      '&redirect_uri=' + encodeURIComponent(this.appRedirectUri());
    // should add PKCE here
    // could add '&prompt=none' here

    // store state for verification after callback return
    nonceStorage.setItem(nonceStorageKey, state);

    // go to login page
    location.href = url;
  }

  /**
   * Try to find "code flow" args in URL (from login callback) and to use them.
   * If they are not present or wrong, the result will be immediate (either null or an observable error).
   */
  tryCompletingCodeFlowLogin(): Observable<AuthResult> {
    const parts = getArgsFromUrl();
    const code = parts.get('code');
    const state = parts.get('state');
    // get and store 'sesssionState' as well?
    clearHash([ 'code', 'state' ]);
    if (!code || !state) {
      return throwError(() => new Error('No code or state for code flow'));
    }
    if (parts.has('errors')) {
      return throwError(() => new Error(`Error received from authenticator: ${parts.get('errors')||'no error'}`));
    }
    const { nonce: nonceInState } = this.parseState(state);
    if (!nonceInState || nonceInState !== nonceStorage.getItem(nonceStorageKey)) {
      return throwError(() => new Error('Invalid state received'));
    }
    nonceStorage.removeItem(nonceStorageKey); // no need to store the nonce any longer
    // the code can be used to get a token back
    return this.authHttp.createTokenFromCode(code, this.appRedirectUri());
  }

  logoutOnAuthServer(): void {
    const logoutUri = appConfig.oauthServerUrl+'/logout?' + 'redirect_uri=' + encodeURIComponent(this.appRedirectUri());
    // navigate
    location.href = logoutUri;
  }

  private appRedirectUri(): string {
    return `${window.location.origin}${this.location.prepareExternalUrl('')}`;
  }

  private parseState(state: string): {nonce: string, userState: string} {
    const nonceStateSeparator = ';';
    let nonce = state;
    let userState = '';
    if (state) {
      const idx = state.indexOf(nonceStateSeparator);
      if (idx > -1) {
        nonce = state.substring(0, idx);
        userState = state.substring(idx + nonceStateSeparator.length);
      }
    }
    return { nonce: nonce, userState: userState };
  }

  private createNonce(): string {
    const unreserved = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let size = 45;
    let id = '';
    while (0 < size--) {
      id += unreserved[(Math.random() * unreserved.length) | 0];
    }
    return base64UrlEncode(id);
  }

}
