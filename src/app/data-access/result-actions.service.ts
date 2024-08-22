import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SimpleActionResponse, ActionResponse, successData } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import { requestTimeout } from 'src/app/interceptors/interceptor_common';
import { decodeSnakeCaseZod } from '../utils/operators/decode';
import { Result, attemptResultSchema, resultFromFetchedResult } from '../items/models/attempts';

const startResultTimeout = 8000;
const startResultPathTimeout = 10000;

type AttemptId = string;

@Injectable({
  providedIn: 'root'
})
export class ResultActionsService {

  constructor(private http: HttpClient) {}

  start(itemIdPath: string[], attemptId: string): Observable<Result> {
    const path = itemIdPath.join('/');
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/items/${path}/start-result`, null, {
        params: {
          attempt_id: attemptId
        },
        context: new HttpContext().set(requestTimeout, startResultTimeout),
      })
      .pipe(
        map(successData),
        decodeSnakeCaseZod(attemptResultSchema),
        map(resultFromFetchedResult),
      );
  }

  /*
   * Start an item when no attempt or parent attempt is known. To be used only in this case!
   */
  startWithoutAttempt(itemIdPath: string[]): Observable<AttemptId> {
    const path = itemIdPath.join('/');
    return this.http
      .post<ActionResponse<{ attempt_id: string }>>(`${appConfig.apiUrl}/items/${path}/start-result-path`, null, {
        context: new HttpContext().set(requestTimeout, startResultPathTimeout),
      })
      .pipe(
        map(successData),
        map(data => data.attempt_id)
      );
  }

}
