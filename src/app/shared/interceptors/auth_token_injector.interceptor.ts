import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, filter, take, retryWhen, mergeMap } from 'rxjs/operators';
import { headersForAuth } from '../helpers/auth';
import { appConfig } from '../helpers/config';
import { AuthResult, AuthStatus } from '../auth/auth-info';

/**
 * This interceptor add the authentication token (in the headers) to all outgoing request to the API
 * Note that it must be combined with a timeout interceptor so that having no token does not block all requests
 */
@Injectable()
export class AuthTokenInjector implements HttpInterceptor {

  constructor(public auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.toLowerCase().startsWith(appConfig.apiUrl)) {
      return next.handle(req);
    }

    // take the latest token (and wait for one if the current one is null
    // and inject it into the header of the request
    return this.auth.status$
      .pipe(
        filter<AuthStatus, AuthResult>((auth):auth is AuthResult => auth.authenticated),
        take(1), // complete after emitting the first non-null auth
        switchMap(auth => next.handle(auth.useCookie ? req : req.clone({ setHeaders: headersForAuth(auth.accessToken) }))),
        // when we get a 401 - we retry once (as the token should have been replaced)
        retryWhen(errors => errors.pipe(
          mergeMap((err, idx) => (idx === 0 && err instanceof HttpErrorResponse && err.status === 401 &&
            req.url.toLowerCase().startsWith(appConfig.apiUrl) ? of(err) : throwError(err)))
        ))
      );
  }
}
