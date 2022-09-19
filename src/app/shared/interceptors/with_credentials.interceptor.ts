import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';
import { isRequestToApi } from './interceptor_common';

@Injectable()
export class WithCredentialsInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isRequestToApi(req) || appConfig.authType !== 'cookies') return next.handle(req);

    // `withCredentials: true` adds appropriate cookies to the request and allow response cookies to be accepted
    // see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
    return next.handle(req.clone({ withCredentials: true }));
  }
}
