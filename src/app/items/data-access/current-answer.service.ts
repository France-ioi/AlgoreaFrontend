import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { ActionResponse, assertSuccess } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

const existingCurrentAnswerDecoder = D.struct({
  answer: D.nullable(D.string),
  attemptId: D.nullable(D.string),
  authorId: D.string,
  id: D.string,
  itemId: D.string,
  score: D.nullable(D.number),
  state: D.nullable(D.string),
  type: D.literal('Submission', 'Saved', 'Current'),
});

const noCurrentAnswerDecoder = D.struct({ type: D.literal(null) });
const currentAnswerDecoder = D.union(existingCurrentAnswerDecoder, noCurrentAnswerDecoder);

type ExistingCurrentAnswer = D.TypeOf<typeof existingCurrentAnswerDecoder>;

interface UpdateCurrentAnswerBody {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class CurrentAnswerService {

  constructor(private http: HttpClient) {}

  get(itemId: string, attemptId: string, asTeamId?: string): Observable<ExistingCurrentAnswer|null> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/current-answer`, { params }).pipe(
      decodeSnakeCase(currentAnswerDecoder),
      map(a => (a.type === null ? null : a)), // convert "no current answer" response to "null"
    );
  }

  update(itemId: string, attemptId: string, body: UpdateCurrentAnswerBody, asTeamId?: string): Observable<void> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http
      .put<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/answers/current`, body, { params })
      .pipe(map(assertSuccess), map(() => undefined));
  }

}
