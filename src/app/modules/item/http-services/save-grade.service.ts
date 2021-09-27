import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { TaskToken } from './task-token.service';
import { TaskScore, TaskScoreToken } from '../task-communication/types';
import { AnswerToken } from './generate-answer-token.service';

export const saveGradeResponseDecoder = D.struct({
  data: D.struct({
    taskToken: D.string,
    validated: D.boolean,
  }),
  message: D.string,
  success: D.boolean,
});

type SaveGradeResponse = D.TypeOf<typeof saveGradeResponseDecoder>;

@Injectable({
  providedIn: 'root',
})
export class SaveGradeService {

  constructor(private http: HttpClient) {}

  save(
    taskToken: TaskToken,
    answerToken?: AnswerToken,
    score?: TaskScore,
    scoreToken?: TaskScoreToken,
  ): Observable<SaveGradeResponse> {
    return this.http.post<unknown>(`${appConfig.apiUrl}/items/save-grade`, {
      task_token: taskToken,
      answer_token: answerToken,
      score,
      score_token: scoreToken,
    }).pipe(
      decodeSnakeCase(saveGradeResponseDecoder),
    );
  }

}
