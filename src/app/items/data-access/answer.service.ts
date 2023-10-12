import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';

export interface SaveAnswerPayload {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class AnswerService {

  constructor(private http: HttpClient) {}

  save(itemId: string, attemptId: string, payload: SaveAnswerPayload): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/answers`, payload)
      .pipe(map(assertSuccess));
  }

}
