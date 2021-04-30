import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { ActionResponse, SimpleActionResponse, successData, assertSuccess } from './action-response';
import { map, timeout } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { headersForAuth } from '../helpers/auth';
import { appConfig } from '../helpers/config';
import { AuthResult, cookieAuthFromServiceResp, tokenAuthFromServiceResp } from '../auth/auth-info';

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
  private cookieOptions = appConfig.useCookies ? {
    use_cookie: true,
    cookie_secure: appConfig.secure,
    cookie_same_site: appConfig.sameSite,
  } : {};

  constructor(
    private handler: HttpBackend,
  ) {
    this.http = new HttpClient(this.handler);
  }

  createTempUser(): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<AuthPayload>>(`${appConfig.apiUrl}/auth/temp-user`, this.cookieOptions)
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
        { code: code, redirect_uri: redirectUri, ...this.cookieOptions } // payload data
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
    if (!appConfig.useTokens) throw new Error('try to refresh token while app does not use token');
    return this.http
      .post<ActionResponse<TokenAuthPayload>>(`${appConfig.apiUrl}/auth/token`, null, { headers: headersForAuth(token) }).pipe(
        timeout(longAuthServicesTimeout),
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  refreshCookie(): Observable<AuthResult> {
    if (!appConfig.useCookies) throw new Error('try not to provide token while app uses token');
    return this.http
      .post<ActionResponse<CookieAuthPayload>>(`${appConfig.apiUrl}/auth/token`, this.cookieOptions).pipe(
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
        !auth.useCookie ? { headers: headersForAuth(auth.accessToken) } : {} // options
      ).pipe(
        map(assertSuccess)
      );
  }

  private authPayloadToResult(payload: AuthPayload): AuthResult {
    if ('access_token' in payload) {
      if (!appConfig.useTokens) throw new Error('token received while not using tokens');
      return tokenAuthFromServiceResp(payload.access_token, payload.expires_in);
    } else {
      if (appConfig.useTokens) throw new Error('no token received while using tokens');
      return cookieAuthFromServiceResp(payload.expires_in);
    }
  }

}
