import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { ActionResponse, SimpleActionResponse, successData, assertSuccess } from './action-response';
import { map, timeout } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { headersForAuth } from '../helpers/auth';
import { appConfig } from '../helpers/config';
import { AuthResult, cookieAuthFromServiceResp, tokenAuthFromServiceResp } from '../auth/auth-info';
import { getDomain } from '../helpers/domain';

interface CookieAuthPayload { expires_in: number }
interface TokenAuthPayload { access_token: string, expires_in: number }
type AuthPayload = CookieAuthPayload|TokenAuthPayload;

const authServicesTimeout = 5000; // timeout (in ms) specific to these services
const longAuthServicesTimeout = 10000;

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {

  private http: HttpClient; // an http client specific to this class, skipping all http interceptors
  private apiUrl = new URL(appConfig.apiUrl);
  private isSameDomain = getDomain(appConfig.apiUrl) === getDomain(globalThis.location.href);
  private cookieParams = appConfig.authType === 'cookies' ? {
    use_cookie: '1',
    cookie_secure: this.apiUrl.protocol === 'https:' || this.apiUrl.hostname === 'localhost' ? '1' : '0',
    cookie_same_site: '1',
    /**
     * NOTE on cookie_same_site:
     * The 'same-site' policy only applies for auth by third-party cookie.
     * A cookie party is defined by its domain:
     * - first-party cookies have domain "dev.algorea.org", "api.algorea.org" or "algorea.org"
     * - third-party cookies have domain or "complete-other-site.com"
     * Safari and Firefox both disable third-party cookies by default, and Chrome will in 2021 (but postponed for 2023)
     * Since third-party cookies will be removed in a near future, we chose not to enable this type of authentication,
     * making the 'same-site' policy always true.
     */
  } : undefined;
  private requestConfig = appConfig.authType === 'cookies' ? {
    withCredentials: !this.isSameDomain,
    /**
     * NOTE:
     * withCredentials is necessary to allow cross-origin resources to set cookies, even if the resources share the same domain.
     * For instance, dev.algorea.org calling api.algorea.org is a cross-origin request,
     * but a cookie with domain "algorea.org" is a first-party cookie, see note on cookie_same_site.
     */
  } : undefined;

  constructor(
    private handler: HttpBackend,
  ) {
    this.http = new HttpClient(this.handler);
  }

  createTempUser(defaultLanguage: string): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<AuthPayload>>(`${appConfig.apiUrl}/auth/temp-user`, null, {
        params: new HttpParams({ fromObject: { ...this.cookieParams, default_language: defaultLanguage } }),
        ...this.requestConfig,
      })
      .pipe(
        timeout(authServicesTimeout),
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  createTokenFromCode(code: string, redirectUri: string): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<AuthPayload>>(
        `${appConfig.apiUrl}/auth/token`,
        { code: code, redirect_uri: redirectUri }, // payload data
        { params: new HttpParams({ fromObject: this.cookieParams }), ...this.requestConfig }
      ).pipe(
        timeout(longAuthServicesTimeout),
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  refreshAuth(auth: AuthResult): Observable<AuthResult> {
    return auth.useCookie ? this.refreshCookie() : this.refreshToken(auth.accessToken);
  }

  refreshToken(token: string): Observable<AuthResult> {
    if (appConfig.authType !== 'tokens') throw new Error('try to refresh token while app does not use token');
    return this.http
      .post<ActionResponse<TokenAuthPayload>>(`${appConfig.apiUrl}/auth/token`, null, { headers: headersForAuth(token) }).pipe(
        timeout(longAuthServicesTimeout),
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  refreshCookie(): Observable<AuthResult> {
    if (appConfig.authType !== 'cookies') throw new Error('try not to provide token while app uses token');
    return this.http
      .post<ActionResponse<CookieAuthPayload>>(`${appConfig.apiUrl}/auth/token`, null, {
        params: new HttpParams({ fromObject: this.cookieParams }),
        ...this.requestConfig,
      }).pipe(
        timeout(longAuthServicesTimeout),
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  revokeAuth(auth: AuthResult): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(
        `${appConfig.apiUrl}/auth/logout`,
        null, // payload data
        !auth.useCookie ? { headers: headersForAuth(auth.accessToken) } : this.requestConfig // options
      ).pipe(
        map(assertSuccess)
      );
  }

  private authPayloadToResult(payload: AuthPayload): AuthResult {
    if ('access_token' in payload) {
      if (appConfig.authType !== 'tokens') throw new Error('token received while not using tokens');
      return tokenAuthFromServiceResp(payload.access_token, payload.expires_in);
    } else {
      if (appConfig.authType === 'tokens') throw new Error('no token received while using tokens');
      return cookieAuthFromServiceResp(payload.expires_in);
    }
  }

}
