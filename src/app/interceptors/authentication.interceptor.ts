import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { switchMap, filter, take, catchError } from 'rxjs/operators';
import { AuthResult, AuthStatus } from '../services/auth/auth-info';
import { isRequestToApi, retryOnceOn401, useAuthInterceptor } from './interceptor_common';
import { errorIsHTTPUnauthenticated } from '../utils/errors';

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

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // skip interception if not req to API or the context skips it
    if (!isRequestToApi(req) || !req.context.get(useAuthInterceptor)) return next.handle(req);

    // Inject the auth service at runtime injecting in the constructor blocks the whole process because of the dependancy loop
    // (as auth service call http services)
    const authService = this.injector.get(AuthService);

    return authService.status$.pipe(
      // take the latest token (and wait for one if the current one is null
      filter<AuthStatus, AuthResult>((auth):auth is AuthResult => auth.authenticated),
      take(1), // prevent auth changes to reset ongoing request
      switchMap(auth => this.callNextWithAuth(req, next, auth).pipe(
        catchError(err => {
          const currentAuth = authService.status$.value;
          // on 401 -> retry once if the auth has changed
          if (errorIsHTTPUnauthenticated(err)) {
            authService.invalidToken(auth); // inform that "auth" is invalid (if still in use)
            // auth has changed in the meantime -> retry
            if (req.context.get(retryOnceOn401) && auth !== currentAuth && currentAuth.authenticated) {
              return this.callNextWithAuth(req, next, currentAuth).pipe(
                catchError(err => {
                  if (errorIsHTTPUnauthenticated(err)) {
                    authService.invalidToken(currentAuth); // inform the token is invalid (if still in use)
                  }
                  throw err; // rethrow the error anyway (401 or not)
                })
              );
            }
          }
          throw err;
        }),
      ))
    );
  }

  private callNextWithAuth(req: HttpRequest<unknown>, next: HttpHandler, auth: AuthResult): Observable<HttpEvent<unknown>> {
    return next.handle(auth.useCookie ? req : req.clone({ setHeaders: this.headersForTokenAuth(auth.accessToken) }));
  }

  private headersForTokenAuth(token: string): { [name: string]: string | string[] } {
    return {
      // "Authorization" is name to be used in http header
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: `Bearer ${token}`,
    };
  }
}
