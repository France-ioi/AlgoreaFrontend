import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { isRequestToApi } from './interceptor_common';

export function withCredentialsInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const config = inject(APPCONFIG);

  if (!isRequestToApi(req, config.apiUrl) || config.authType !== 'cookies') return next(req);

  // `withCredentials: true` adds appropriate cookies to the request and allow response cookies to be accepted
  // see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  return next(req.clone({ withCredentials: true }));
}
