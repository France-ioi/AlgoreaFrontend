import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { map } from 'rxjs/operators';

export const answerTokenResponseDecoder = D.struct({
  data: D.struct({
    answerToken: D.string,
  }),
  message: D.string,
  success: D.boolean,
});

type AnswerTokenResponse = D.TypeOf<typeof answerTokenResponseDecoder>;
export type AnswerToken = AnswerTokenResponse['data']['answerToken'];

@Injectable({
  providedIn: 'root',
})
export class GenerateAnswerTokenService {

  constructor(private http: HttpClient) {}

  generateToken(answer: string, taskToken: string): Observable<AnswerToken> {
    return this.http.post<unknown>(`${appConfig.apiUrl}/answers`, {
      answer,
      task_token: taskToken,
    }).pipe(
      decodeSnakeCase(answerTokenResponseDecoder),
      map(({ data }) => data.answerToken),
    );
  }

}
