import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SimpleActionResponse, assertSuccess, ActionResponse, successData } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';

type AttemptId = string;

@Injectable({
  providedIn: 'root'
})
export class ResultActionsService {

  constructor(private http: HttpClient) {}

  start(itemIdPath: string[], attemptId: string): Observable<void> {
    const path = itemIdPath.join('/');
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/items/${path}/start-result`, null, {
        params: {
          attempt_id: attemptId
        }
      })
      .pipe(
        map(assertSuccess)
      );
  }

  /*
   * Start an item when no attempt or parent attempt is known. To be used only in this case!
   */
  startWithoutAttempt(itemIdPath: string[]): Observable<AttemptId> {
    const path = itemIdPath.join('/');
    return this.http
      .post<ActionResponse<{ attempt_id: string }>>(`${appConfig.apiUrl}/items/${path}/start-result-path`, null, {})
      .pipe(
        map(successData),
        map(data => data.attempt_id)
      );
  }

}
