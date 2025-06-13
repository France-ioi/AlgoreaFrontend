import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';
import { APPCONFIG } from 'src/app/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { ActionResponse, successData } from 'src/app/data-access/action-response';

const taskTokenDataSchema = z.object({
  taskToken: z.string(),
});

type TaskTokenData = z.infer<typeof taskTokenDataSchema>;
export type TaskToken = TaskTokenData['taskToken'];

@Injectable({
  providedIn: 'root',
})
export class TaskTokenService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  generate(itemId: string, attemptId: string, asTeamId?: string): Observable<TaskToken> {
    const params = asTeamId ? new HttpParams({ fromObject: { as_team_id: asTeamId } }) : undefined;
    return this.http.post<ActionResponse<unknown>>(
      `${this.config.apiUrl}/items/${itemId}/attempts/${attemptId}/generate-task-token`,
      undefined,
      { params },
    ).pipe(
      map(successData),
      decodeSnakeCase(taskTokenDataSchema),
      map(data => data.taskToken),
    );
  }

  generateForAnswer(answerId: string): Observable<TaskToken> {
    return this.http.post<ActionResponse<unknown>>(`${this.config.apiUrl}/answers/${answerId}/generate-task-token`, undefined).pipe(
      map(successData),
      decodeSnakeCase(taskTokenDataSchema),
      map(data => data.taskToken),
    );
  }

}
