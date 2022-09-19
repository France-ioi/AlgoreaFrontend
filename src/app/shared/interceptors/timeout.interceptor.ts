import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { requestTimeout } from './interceptor_common';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      timeout(req.context.get(requestTimeout)),
      catchError(err => {
        if (err instanceof TimeoutError) {
          throw new HttpErrorResponse({
            error: err,
            status: 408, // timeout http status code
            statusText: 'Request Timeout (interceptor)',
            headers: req.headers,
            url: req.url,
          });
        }
        throw err;
      })
    );
  }
}
