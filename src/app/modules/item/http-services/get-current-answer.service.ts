import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { switchMap } from 'rxjs/operators';

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

const shortAnswerDecoder = D.struct({
  id: D.string,
  type: D.literal('Submission', 'Saved', 'Current'),
});

@Injectable({
  providedIn: 'root',
})
export class GetCurrentAnswerService {

  constructor(private http: HttpClient) {}

  // get(itemId: string, attemptId: string, asTeamId?: string): Observable<Answer | null> {
  //   const params = new HttpParams({
  //     fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
  //   });
  //   return this.http
  //     .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/current-answer`, { params })
  //     .pipe(decodeSnakeCase(answerDecoder));
  // }

  // FIXME: use GET current-answer route when access rights are fixed.
  get(itemId: string, attemptId: string, authorId: string): Observable<Answer | null> {
    const params = new HttpParams({
      fromObject: { attempt_id: attemptId, author_id: authorId, limit: 1 },
    });
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/answers`, { params }).pipe(
      decodeSnakeCase(D.array(shortAnswerDecoder)),
      switchMap(list => {
        const answer = list[0];
        return answer ? this.getAnswer(answer.id) : of(null);
      }),
    );
  }

  private getAnswer(answerId: string): Observable<Answer> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/answers/${answerId}`).pipe(
      decodeSnakeCase(answerDecoder),
    );
  }

}
