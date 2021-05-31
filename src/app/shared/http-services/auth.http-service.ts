import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
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
  private cookieParams = appConfig.authType === 'cookies' ? {
    use_cookie: '1',
    cookie_secure: appConfig.secure ? '1' : '0',
    cookie_same_site: appConfig.sameSite ? '1' : '0',
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
        { params: new HttpParams({ fromObject: this.cookieParams }) }
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
        !auth.useCookie ? { headers: headersForAuth(auth.accessToken) } : {} // options
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
