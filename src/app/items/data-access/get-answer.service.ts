import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { dateDecoder } from 'src/app/utils/decoders';

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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(answerId: string): Observable<Answer> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/answers/${answerId}`)
      .pipe(decodeSnakeCase(answerDecoder));
  }

  getBest(itemId: string, options?: { watchedGroupId?: string }): Observable<Answer> {
    let params = new HttpParams();
    if (options?.watchedGroupId) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemId}/best-answer`, { params })
      .pipe(decodeSnakeCase(answerDecoder));
  }

}
