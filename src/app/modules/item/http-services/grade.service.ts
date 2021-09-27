import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { TaskToken } from './task-token.service';
import { TaskScore, TaskScoreToken } from '../task-communication/types';
import { AnswerToken } from './answer-token.service';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';
import { map, mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GradeService {

  constructor(private http: HttpClient) {}

  save(
    taskToken: TaskToken,
    answerToken?: AnswerToken,
    score?: TaskScore,
    scoreToken?: TaskScoreToken,
  ): Observable<void> {
    return this.http.post<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/save-grade`, {
      task_token: taskToken,
      answer_token: answerToken,
      score,
      score_token: scoreToken,
    }).pipe(
      map(successData),
      mapTo(undefined),
    );
  }

}
