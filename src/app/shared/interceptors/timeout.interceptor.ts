import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  constructor(@Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const timeoutValue = req.headers.get('timeout') || this.defaultTimeout;
    const originReq = req.clone({
      headers: req.headers.delete('timeout')
    });

    return next.handle(originReq).pipe(
      timeout(Number(timeoutValue)),
      catchError(err => {
        if (err instanceof TimeoutError) {
          throw new HttpErrorResponse({
            error: err,
            status: 408, // timeout http status code
            statusText: 'Request Timeout (interceptor)',
            headers: originReq.headers,
            url: originReq.url,
          });
        }
        throw err;
      })
    );
  }
}
