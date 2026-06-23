import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { noop, Observable, of, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { requestTimeout } from './interceptor_common';

export function timeoutInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
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
