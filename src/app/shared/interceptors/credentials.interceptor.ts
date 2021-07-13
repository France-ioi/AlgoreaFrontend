import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {

  private isSameOrigin = new URL(appConfig.apiUrl).hostname === globalThis.location.hostname;
  private withCredentials = appConfig.authType === 'cookies' && !this.isSameOrigin;

  constructor() {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.toLowerCase().startsWith(appConfig.apiUrl)) {
      return next.handle(req);
    }

    return next.handle(req.clone({ withCredentials: this.withCredentials }));
  }
}
