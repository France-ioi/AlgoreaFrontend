import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SimpleActionResponse, ActionResponse, successData } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { requestTimeout } from 'src/app/interceptors/interceptor_common';
import { decodeSnakeCase } from '../utils/operators/decode';
import { Result, attemptResultSchema, resultFromFetchedResult } from '../items/models/attempts';
import { AttemptId, ItemPath } from '../models/ids';

const startResultTimeout = 8000;
const startResultPathTimeout = 10000;

@Injectable({
  providedIn: 'root'
})
export class ResultActionsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  start(itemIdPath: ItemPath, attemptId: AttemptId): Observable<Result> {
    const path = itemIdPath.join('/');
    return this.http
      .post<SimpleActionResponse>(`${this.config.apiUrl}/items/${path}/start-result`, null, {
        params: {
          attempt_id: attemptId
        },
        context: new HttpContext().set(requestTimeout, startResultTimeout),
      })
      .pipe(
        map(successData),
        decodeSnakeCase(attemptResultSchema),
        map(resultFromFetchedResult),
      );
  }

  /*
   * Start an item when no attempt or parent attempt is known. To be used only in this case!
   */
  startWithoutAttempt(itemIdPath: ItemPath): Observable<AttemptId> {
    const path = itemIdPath.join('/');
    return this.http
      .post<ActionResponse<{ attempt_id: AttemptId }>>(`${this.config.apiUrl}/items/${path}/start-result-path`, null, {
        context: new HttpContext().set(requestTimeout, startResultPathTimeout),
      })
      .pipe(
        map(successData),
        map(data => data.attempt_id)
      );
  }

}
