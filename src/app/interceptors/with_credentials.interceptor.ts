import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { isRequestToApi } from './interceptor_common';

@Injectable()
export class WithCredentialsInterceptor implements HttpInterceptor {
  private config = inject(APPCONFIG);

  constructor() {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isRequestToApi(req, this.config.apiUrl) || this.config.authType !== 'cookies') return next.handle(req);

    // `withCredentials: true` adds appropriate cookies to the request and allow response cookies to be accepted
    // see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
    return next.handle(req.clone({ withCredentials: true }));
  }
}
