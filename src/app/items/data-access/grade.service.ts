import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { TaskToken } from './task-token.service';
import { TaskScore, TaskScoreToken } from '../api/types';
import { AnswerToken } from './answer-token.service';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { z } from 'zod';
import { itemTypeSchema } from '../models/item-type';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

const saveGradeResultSchema = z.object({
  validated: z.boolean(),
  unlockedItems: z.array(z.object({
    itemId: z.string(),
    languageTag: z.string(),
    title: z.string().nullable(),
    type: itemTypeSchema,
  })),
});

type SaveGradeResult = z.infer<typeof saveGradeResultSchema>;
export type UnlockedItems = SaveGradeResult['unlockedItems'];

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  save(
    taskToken: TaskToken,
    answerToken?: AnswerToken,
    score?: TaskScore,
    scoreToken?: TaskScoreToken,
  ): Observable<SaveGradeResult> {
    return this.http.post<ActionResponse<unknown>>(`${this.config.apiUrl}/items/save-grade`, {
      task_token: taskToken,
      answer_token: answerToken,
      score,
      score_token: scoreToken,
    }).pipe(
      map(successData),
      decodeSnakeCase(saveGradeResultSchema),
    );
  }

}
