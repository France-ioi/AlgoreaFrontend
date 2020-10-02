import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import { switchMap, filter, take, retryWhen, mergeMap } from 'rxjs/operators';
import { AccessToken } from '../auth/access-token';
import { headersForAuth } from '../helpers/auth';

/**
 * This interceptor add the authentication token (in the headers) to all outgoing request to the API
 * Note that it must be combined with a timeout interceptor so that having no token does not block all requests
 */
@Injectable()
export class AuthTokenInjector implements HttpInterceptor {

  constructor(public auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.toLowerCase().startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    // take the latest token (and wait for one if the current one is null
    // and inject it into the header of the request
    return this.auth.accessToken$
      .pipe(
        filter<AccessToken|null, AccessToken>((token):token is AccessToken => token !== null),
        take(1), // complete after emitting the first non-null token
        switchMap(token => next.handle(
          req.clone({ setHeaders: headersForAuth(token.accessToken) })
        )),
        // when we get a 401 - we retry once (as the token should have been replaced)
        retryWhen(errors => errors.pipe(
          mergeMap((err, idx) => (idx === 0 && err instanceof HttpErrorResponse && err.status === 401 &&
            req.url.toLowerCase().startsWith(environment.apiUrl) ? of(err) : throwError(err)))
        ))
      );
  }
}
