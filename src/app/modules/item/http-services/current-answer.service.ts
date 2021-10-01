import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { ActionResponse, assertSuccess } from 'src/app/shared/http-services/action-response';
import { catchError, map, mapTo } from 'rxjs/operators';

export const answerDecoder = D.struct({
  answer: D.nullable(D.string),
  attemptId: D.nullable(D.string),
  authorId: D.string,
  id: D.string,
  itemId: D.string,
  score: D.nullable(D.number),
  state: D.nullable(D.string),
  type: D.literal('Submission', 'Saved', 'Current'),
});

export type Answer = D.TypeOf<typeof answerDecoder>;

interface UpdateCurrentAnswerBody {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class CurrentAnswerService {

  constructor(private http: HttpClient) {}

  get(itemId: string, attemptId: string, asTeamId?: string): Observable<Answer> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/current-answer`, { params })
      .pipe(decodeSnakeCase(answerDecoder));
  }

  update(itemId: string, attemptId: string, body: UpdateCurrentAnswerBody, asTeamId?: string): Observable<void> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    const update$ = this.http
      .put<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/answers/current`, body, { params })
      .pipe(map(assertSuccess), mapTo(undefined));
    // http-server --cors -P 8080 ./src/assets/images/
    const test$ = this.http.get('http://localhost:8080/_messi.jpg').pipe(catchError(() => of(undefined)), mapTo(undefined));
    return forkJoin([ update$, test$ ]).pipe(mapTo(undefined));
  }

}
