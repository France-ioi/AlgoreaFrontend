import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { catchError } from 'rxjs/operators';
import { tokenFromHeaders } from '../helpers/auth';
import { appConfig } from '../helpers/config';

/**
 * This interceptor catch the unauthorized (HTTP status 401) returned from the API and interprets it as as wrong token and so log the
 * user out.
 */
@Injectable()
export class UnauthorizedResponseInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401 && req.url.toLowerCase().startsWith(appConfig.apiUrl)) {
          const token = tokenFromHeaders(req.headers);
          if (token) this.auth.invalidToken(token);
        }
        throw err; // rethrow the error anyway (401 or not)
      })
    );
  }
}
