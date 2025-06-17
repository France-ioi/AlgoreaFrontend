import { HttpEvent, HttpEventType, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { fromTimeOffset } from '../store/time-offset';
import { isRequestToApi } from './interceptor_common';
import { APPCONFIG } from '../config';

/**
 * Interceptor which measures the time difference betweeen the client and the time indicated on server response, and sends it to the store
 */
export function timeOffsetComputationInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const store = inject(Store);
  const config = inject(APPCONFIG);

  return next(req).pipe(
    tap(event => {
      const localTs = Date.now();
      if (!isRequestToApi(req, config.apiUrl)) return;
      if (event.type !== HttpEventType.Response) return;
      const serverDateString = event.headers.get('Date');
      if (!serverDateString) return;
      const serverTs = Date.parse(serverDateString);
      const offset = serverTs - localTs;
      store.dispatch(fromTimeOffset.interceptorActions.reportOffset({ offset }));
    })
  );
}
