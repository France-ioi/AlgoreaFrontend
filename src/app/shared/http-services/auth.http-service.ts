import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { ActionResponse, SimpleActionResponse, successData, assertSuccess } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';
import { AuthResult, cookieAuthFromServiceResp, tokenAuthFromServiceResp } from '../auth/auth-info';
import { requestTimeout, retryOnceOn401, useAuthInterceptor } from '../interceptors/interceptor_common';

interface CookieAuthPayload { expires_in: number }
interface TokenAuthPayload { access_token: string, expires_in: number }
type AuthPayload = CookieAuthPayload|TokenAuthPayload;

type RefreshAuthOpts = { createTempUserOnRefreshFailure: true, tempUserDefaultLanguage: string }|{ createTempUserOnRefreshFailure: false };

const longAuthServicesTimeout = 6000;

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {

  private apiUrl = new URL(appConfig.apiUrl, location.origin /* act as base when the url is relative, ignored otherwise */);
  private cookieParams = appConfig.authType === 'cookies' ? {
    use_cookie: '1',
    cookie_secure: this.apiUrl.protocol === 'https:' || this.apiUrl.hostname === 'localhost' ? '1' : '0',
    cookie_same_site: '1',
    /**
     * NOTE on cookie_same_site and the cookie attribute "SameSite":
     * Safari and Firefox both disable third-party cookies by default, and Chrome will in 2021 (but postponed for 2023)
     * Since third-party cookies will be removed in a near future, we chose not to enable this type of authentication,
     * making the 'same-site' policy always true.
     *
     * NOTE on cookie party:
     * A cookie party is determined by its "Domain" attribute, which defaults to the hostname.
     * As defined by the MDN glossary, the domain represents an "authority", an organization to which belongs the cookie.
     * For instance, the authority is "algorea.org".
     * First-party cookies are all the cookies belonging to the authority "algorea.org", no matter the subdomain.
     *
     * NOTE on request cookies (cookies added to a request via header "cookie" by the browser) and Domain attribute:
     * For a given request (with credentials, to simplify), among the cookies with attribute "SameSite=Strict", the browser will
     * send only the first-party cookies which "Domain" attribute matches the requested server hostname.
     * IE:
     * - Cookies with "Domain=algorea.org" will match server "*.algorea.org" and "algorea.org"
     * - Cookies with "Domain=api.algorea.org" will only match server "api.algorea.org"
     * NB: Keep in mind that the browser filters request cookies by other attributes too, like "Path", "Secure", etc.
     *
     * NOTE on response cookies (cookies added to a reponse via header "Set-Cookie" by a server and treated by the browser):
     * 1. For requests between same domain but different subdomains (ie "demo.algorea.org" and "api.algorea.org"),
     *    since the cookies are first-party (aka they share the same authority "algorea.org"), the browser will set them.
     * 2. For requests between same domain and subdomain, cookies are first-party, the browser will accept them. Same as 1.
     * 3. For requests between different _root domain_ (ie "demo.algorea.org" and "fonts.google.com"),
     *    since the cookies sent are third-party Firefox and Safari will not set them.
     *    Chrome currently sets them, but will stop doing so in 2023.
     */
  } : undefined;

  constructor(private http: HttpClient) {}

  createTempUser(defaultLanguage: string): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<AuthPayload>>(`${appConfig.apiUrl}/auth/temp-user`, null, {
        params: new HttpParams({ fromObject: { ...this.cookieParams, default_language: defaultLanguage } }),
        context: new HttpContext().set(useAuthInterceptor, false),
      }).pipe(
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  createTokenFromCode(code: string, redirectUri: string): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<AuthPayload>>(
        `${appConfig.apiUrl}/auth/token`,
        { code: code, redirect_uri: redirectUri }, // payload data
        {
          params: new HttpParams({ fromObject: this.cookieParams }),
          context: new HttpContext()
            .set(useAuthInterceptor, false)
            .set(requestTimeout, longAuthServicesTimeout),
        }
      ).pipe(
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  refreshAuth(options: RefreshAuthOpts = { createTempUserOnRefreshFailure: false }): Observable<AuthResult> {
    return this.http
      .post<ActionResponse<TokenAuthPayload>>(`${appConfig.apiUrl}/auth/token`, null, {
        params: new HttpParams({ fromObject: options.createTempUserOnRefreshFailure ?
          { ...this.cookieParams, create_temp_user_if_not_authorized: 1, default_language: options.tempUserDefaultLanguage } :
          this.cookieParams
        }),
        context: new HttpContext()
          .set(requestTimeout, longAuthServicesTimeout)
          .set(retryOnceOn401, false)
          .set(useAuthInterceptor, false),
      }).pipe(
        map(successData),
        map(p => this.authPayloadToResult(p))
      );
  }

  revokeAuth(): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/auth/logout`, null, {
        context: new HttpContext()
          .set(retryOnceOn401, false)
          .set(useAuthInterceptor, false),
      }).pipe(
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
