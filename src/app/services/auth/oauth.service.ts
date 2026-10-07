import { Injectable, inject } from '@angular/core';
import { getArgsFromUrl, clearHash } from '../../utils/url';
import { Observable, throwError } from 'rxjs';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { base64UrlEncode } from '../../utils/base64';
import { APPCONFIG } from '../../config';
import { AuthResult } from './auth-info';

export class OAuthStorageUnavailableError extends Error {
  constructor(message = 'OAuth storage unavailable', options?: ErrorOptions) {
    super(message, options);
    this.name = 'OAuthStorageUnavailableError';
  }
}

// Use localStorage for nonce if possible — localStorage is the only storage who survives a redirect in ALL browsers (also IE).
// Lazy access: even reading `window.localStorage` can throw SecurityError when storage is blocked (e.g. Firefox tracking protection).
const nonceStorageKey = 'oauth_nonce';
const redirectUriStorageKey = 'oauth_redirect_uri';

function getNonceStorage(): Storage {
  return window.localStorage;
}

function safeStorageGetItem(key: string): string | null {
  try {
    return getNonceStorage().getItem(key);
  } catch {
    return null;
  }
}

function safeStorageRemoveItem(key: string): void {
  try {
    getNonceStorage().removeItem(key);
  } catch {
    // no-op: storage may be blocked after a privacy-mode redirect
  }
}

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private authHttp = inject(AuthHttpService);
  private config = inject(APPCONFIG);

  /**
   * Init authorization code flow login anf redirect the user to the auth server login url.
   */
  initCodeFlow(): void {
    const state = this.createNonce();
    const redirectUri = window.location.href;
    const loginServerUri = this.config.oauthServerUrl+'/oauth/authorize';
    const separationChar = loginServerUri.indexOf('?') > -1 ? '&' : '?';

    const url = loginServerUri + separationChar + 'response_type=code&scope=account&approval_prompt=auto' +
      '&client_id=' + encodeURIComponent(this.config.oauthClientId) +
      '&state=' + encodeURIComponent(state) +
      '&redirect_uri=' + encodeURIComponent(redirectUri);
    // should add PKCE here
    // could add '&prompt=none' here

    try {
      const storage = getNonceStorage();
      storage.setItem(nonceStorageKey, state);
      storage.setItem(redirectUriStorageKey, redirectUri);
    } catch (err) {
      // Do not redirect without a stored nonce — that fails later with "Invalid state received"
      // and silently falls back to a temp user.
      throw new OAuthStorageUnavailableError(undefined, { cause: err });
    }

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
    clearHash([ 'code', 'state', 'session_state', 'iss', 'error', 'error_description' ]);
    // OIDC/OAuth2 use singular `error` (and optional `error_description`); check before the
    // missing-code path so IdP errors are not masked as "No code or state".
    if (parts.has('error')) {
      const error = parts.get('error') || 'no error';
      const description = parts.get('error_description');
      const detail = description ? `${error}: ${description}` : error;
      return throwError(() => new Error(`Error received from authenticator: ${detail}`));
    }
    if (!code || !state) {
      return throwError(() => new Error('No code or state for code flow'));
    }
    const { nonce: nonceInState } = this.parseState(state);
    if (!nonceInState || nonceInState !== safeStorageGetItem(nonceStorageKey)) {
      return throwError(() => new Error('Invalid state received'));
    }
    const redirectUri = safeStorageGetItem(redirectUriStorageKey) ?? window.location.href;
    safeStorageRemoveItem(nonceStorageKey);
    safeStorageRemoveItem(redirectUriStorageKey);
    return this.authHttp.createTokenFromCode(code, redirectUri);
  }

  logoutOnAuthServer(): void {
    const logoutUri = this.config.oauthServerUrl+'/logout?' + 'redirect_uri=' + encodeURIComponent(window.location.href);
    location.href = logoutUri;
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
