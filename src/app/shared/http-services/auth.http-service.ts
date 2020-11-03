import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { ActionResponse, SimpleActionResponse, successData, assertSuccess } from './action-response';
import { map, timeout } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { headersForAuth } from '../helpers/auth';
import { appConfig } from '../helpers/config';

interface AccessTokenInfo {
  access_token: string;
  expires_in: number;
}

const authServicesTimeout = 2000; // timeout (in ms) specific to these services
const longAuthServicesTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {

  private http: HttpClient; // an http client specific to this class, skipping all http interceptors

  constructor(
    private handler: HttpBackend,
  ) {
    this.http = new HttpClient(this.handler);
  }

  createTempUser(): Observable<AccessTokenInfo> {
    return this.http
      .post<ActionResponse<AccessTokenInfo>>(`${appConfig().apiUrl}/auth/temp-user`, null, {})
      .pipe(
        timeout(authServicesTimeout),
        map(successData),
      );
  }

  createTokenFromCode(code: string, redirectUri: string): Observable<AccessTokenInfo> {
    return this.http
      .post<ActionResponse<AccessTokenInfo>>(`${appConfig().apiUrl}/auth/token`, {
        code: code,
        redirect_uri: redirectUri
      }, {})
      .pipe(
        timeout(longAuthServicesTimeout),
        map(successData),
      );
  }

  revokeToken(token: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig().apiUrl}/auth/logout`, null, { headers: headersForAuth(token) })
      .pipe(
        map(assertSuccess)
      );
  }

}
