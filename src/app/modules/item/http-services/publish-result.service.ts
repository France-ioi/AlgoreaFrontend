import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/shared/http-services/action-response';
import { requestTimeout } from 'src/app/shared/interceptors/interceptor_common';

const publishServiceTimeout = 5000; // it the backend service depends on other services, it is useful to allow more time

@Injectable({
  providedIn: 'root',
})
export class PublishResultsService {

  constructor(private http: HttpClient) {}

  publish(itemId: string, attemptId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/publish`, null, {
        context: new HttpContext().set(requestTimeout, publishServiceTimeout),
      }).pipe(map(assertSuccess));
  }

}
