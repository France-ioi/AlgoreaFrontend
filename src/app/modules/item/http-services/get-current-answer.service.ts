import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

export const answerDecoder = D.struct({
  answer: D.nullable(D.string),
  attempt_id: D.nullable(D.number),
  author_id: D.string,
  id: D.string,
  item_id: D.string,
  score: D.nullable(D.number),
  state: D.nullable(D.string),
  type: D.literal('Submission', 'Saved', 'Current'),
});

export type Answer = D.TypeOf<typeof answerDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetCurrentAnswerService {

  constructor(private http: HttpClient) {}

  getCurrentAnswer(itemId: string, attemptId: string, asTeamId?: string): Observable<Answer> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/current-answer`, { params }).pipe(
      decodeSnakeCase(answerDecoder),
    );
  }

}
