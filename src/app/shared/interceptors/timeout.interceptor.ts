import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { noop, Observable, of, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { requestTimeout } from './interceptor_common';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      timeout(req.context.get(requestTimeout)),
      retry({ // retry once GET requests which get a timeout error
        count: 1,
        delay: err => {
          if (err instanceof TimeoutError && req.method === 'GET') return of(noop);
          throw err;
        }
      }),
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
