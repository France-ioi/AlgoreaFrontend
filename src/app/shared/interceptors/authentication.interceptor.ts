import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, filter, take, catchError } from 'rxjs/operators';
import { headersForAuth } from '../helpers/auth';
import { AuthResult, AuthStatus } from '../auth/auth-info';
import { isRequestToApi, useAuthInterceptor } from './interceptor_common';
import { errorIsHTTPUnauthenticated } from '../helpers/errors';

/**
 * This interceptor:
 * - waits for the authentication to be ready before sending the request
 * - retries (once) every "unauthorized" request as it may have happen during an authentication transition
 * - log the user out on subsequent "unauthorized" response
 * - when the authentication mode is "token", injects the token in the authorization header.
 *
 * Note that it must be combined with a timeout interceptor so that having no token does not block all requests.
 */
@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // skip interception if not req to API or the context skips it
    if (!isRequestToApi(req) || !req.context.get(useAuthInterceptor)) return next.handle(req);

    return this.auth.status$.pipe(
      // take the latest token (and wait for one if the current one is null
      filter<AuthStatus, AuthResult>((auth):auth is AuthResult => auth.authenticated),
      take(1), // prevent auth changes to reset ongoing request
      switchMap(auth => this.callNextWithAuth(req, next, auth).pipe(
        catchError(err => {
          const currentAuth = this.auth.status$.value;
          // on 401 -> retry once if the auth has changed
          if (errorIsHTTPUnauthenticated(err)) {
            this.auth.invalidToken(auth); // inform that "auth" is invalid (if still in use)
            // auth has changed in the meantime -> retry
            if (auth !== currentAuth && currentAuth.authenticated) return this.callNextWithAuth(req, next, currentAuth).pipe(
              catchError(err => {
                if (errorIsHTTPUnauthenticated(err)) this.auth.invalidToken(currentAuth); // inform the token is invalid (if still in use)
                throw err; // rethrow the error anyway (401 or not)
              })
            );
          }
          throw err;
        }),
      ))
    );
  }

  private callNextWithAuth(req: HttpRequest<unknown>, next: HttpHandler, auth: AuthResult): Observable<HttpEvent<unknown>> {
    return next.handle(auth.useCookie ? req : req.clone({ setHeaders: headersForAuth(auth.accessToken) }));
  }
}
