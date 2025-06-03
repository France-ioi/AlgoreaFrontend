import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { APPCONFIG } from 'src/app/app.config';

const askHintDataSchema = z.object({
  taskToken: z.string(),
});
export type AskHintData = z.infer<typeof askHintDataSchema>;


@Injectable({
  providedIn: 'root',
})
export class AskHintService {
  private config = inject(APPCONFIG);

  constructor(
    private http: HttpClient,
  ) {}

  ask(taskToken: string, hintRequested: string): Observable<AskHintData> {

    return this.http
      .post<ActionResponse<unknown>>(`${this.config.apiUrl}/items/ask-hint`, {
        task_token: taskToken,
        hint_requested: hintRequested,
      }).pipe(
        map(successData),
        decodeSnakeCaseZod(askHintDataSchema)
      );
  }

}
