import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from 'src/app/shared/helpers/decoders';

export const answerDecoder = D.struct({
  answer: D.nullable(D.string),
  attemptId: D.nullable(D.string),
  authorId: D.string,
  createdAt: dateDecoder,
  gradedAt: D.nullable(dateDecoder),
  id: D.string,
  itemId: D.string,
  score: D.nullable(D.number),
  state: D.nullable(D.string),
  type: D.literal('Submission', 'Saved', 'Current'),
});

export type Answer = D.TypeOf<typeof answerDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetAnswerService {

  constructor(private http: HttpClient) {}

  get(answerId: string): Observable<Answer> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/answers/${answerId}`)
      .pipe(decodeSnakeCase(answerDecoder));
  }

  getBest(itemId: string, options?: { watchedGroupId?: string }): Observable<Answer> {
    let params = new HttpParams();
    if (options?.watchedGroupId) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/best-answer`, { params })
      .pipe(decodeSnakeCase(answerDecoder));
  }

}
