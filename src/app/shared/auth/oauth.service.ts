import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { getArgsFromUrl, clearHash } from '../helpers/url';
import { Observable, throwError, of } from 'rxjs';
import { AccessToken } from './access-token';
import { AuthHttpService } from '../http-services/auth.http-service';
import { map } from 'rxjs/operators';
import { base64UrlEncode } from '../helpers/base64';

// Use localStorage for nonce if possible localStorage is the only storage who survives a redirect in ALL browsers (also IE)
const nonceStorage = localStorage;
const nonceStorageKey = 'oauth_nonce';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {

  private clientId: string;

  constructor(private authHttp: AuthHttpService) {
    this.clientId = environment.oauthClientId;
  }

  /**
   * Init authorization code flow login anf redirect the user to the auth server login url.
   */
  initCodeFlow() {
    const state = this.createNonce();
    const loginServerUri = environment.oauthServerUrl+'/oauth/authorize';
    const separationChar = loginServerUri.indexOf('?') > -1 ? '&' : '?';

    const url = loginServerUri + separationChar + 'response_type=code&scope=account&approval_prompt=auto' +
      '&client_id=' +  encodeURIComponent(environment.oauthClientId) +
      '&state=' + encodeURIComponent(state) +
      '&redirect_uri=' + encodeURIComponent(this.loginRedirectUri());
    // should add PKCE here
    // could add '&prompt=none' here

    // store state for verification after callback return
    nonceStorage.setItem(nonceStorageKey, state);

    // go to login page
    location.href = url;
  }

  /**
   * Try to find "code flow" args in URL (from login callback) and to use them.
   * If they are not present or wrong, the result will be immediate (either a null token or an observable error).
   */
  tryCompletingCodeFlowLogin(): Observable<AccessToken|null> {
    const parts = getArgsFromUrl();
    const code = parts.get('code');
    const state = parts.get('state');
    // get and store 'sesssionState' as well?
    clearHash(['code', 'state']);
    if (!code || !state) {
      return of<AccessToken|null>(null);
    }
    if (parts.has('errors')) {
      return throwError(new Error(`Error received from authenticator: ${parts.get('errors')||'no error'}`));
    }
    const {nonce: nonceInState} = this.parseState(state);
    if (!nonceInState || nonceInState !== nonceStorage.getItem(nonceStorageKey)) {
      return throwError(new Error('Invalid state received'));
    }
    nonceStorage.removeItem(nonceStorageKey); // no need to store the nonce any longer
    // the code can be used to get a token back
    return this.authHttp.createTokenFromCode(code, this.loginRedirectUri()).pipe(
      map((t) => {
        return AccessToken.fromCountdown(t.access_token, t.expires_in, 'authenticated');
      })
    );
  }

  private loginRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/#/`;
  }

  private parseState(state: string): {nonce: string, userState: string} {
    const nonceStateSeparator = ';';
    let nonce = state;
    let userState = '';
    if (state) {
        const idx = state.indexOf(nonceStateSeparator);
        if (idx > -1) {
            nonce = state.substr(0, idx);
            userState = state.substr(idx + nonceStateSeparator.length);
        }
    }
    return { nonce: nonce, userState: userState };
  }

  private createNonce() {
    const unreserved = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let size = 45;
    let id = '';
    while (0 < size--) {
      id += unreserved[(Math.random() * unreserved.length) | 0];
    }
    return base64UrlEncode(id);
  }

}
