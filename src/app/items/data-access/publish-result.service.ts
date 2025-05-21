import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { requestTimeout } from 'src/app/interceptors/interceptor_common';

const publishServiceTimeout = 5000; // it the backend service depends on other services, it is useful to allow more time

@Injectable({
  providedIn: 'root',
})
export class PublishResultsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  publish(itemId: string, attemptId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${this.config.apiUrl}/items/${itemId}/attempts/${attemptId}/publish`, null, {
        context: new HttpContext().set(requestTimeout, publishServiceTimeout),
      }).pipe(map(assertSuccess));
  }

}
