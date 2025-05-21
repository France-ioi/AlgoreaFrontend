import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';
import { ActionResponse, successData } from 'src/app/data-access/action-response';

const answerTokenDataDecoder = D.struct({
  answerToken: D.string,
});

type AnswerTokenData = D.TypeOf<typeof answerTokenDataDecoder>;
export type AnswerToken = AnswerTokenData['answerToken'];

@Injectable({
  providedIn: 'root',
})
export class AnswerTokenService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  generate(answer: string, taskToken: string): Observable<AnswerToken> {
    return this.http.post<ActionResponse<unknown>>(`${this.config.apiUrl}/answers`, {
      answer,
      task_token: taskToken,
    }).pipe(
      map(successData),
      decodeSnakeCase(answerTokenDataDecoder),
      map(data => data.answerToken),
    );
  }

}
