import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { ActionResponse, assertSuccess } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

const existingCurrentAnswerSchema = z.object({
  answer: z.string().nullable(),
  attemptId: z.string().nullable(),
  authorId: z.string(),
  id: z.string(),
  itemId: z.string(),
  score: z.number().nullable(),
  state: z.string().nullable(),
  type: z.enum([ 'Submission', 'Saved', 'Current' ]),
});

const noCurrentAnswerSchema = z.object({ type: z.null() });
const currentAnswerSchema = z.union([ existingCurrentAnswerSchema, noCurrentAnswerSchema ]);

type ExistingCurrentAnswer = z.infer<typeof existingCurrentAnswerSchema>;

interface UpdateCurrentAnswerBody {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class CurrentAnswerService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(itemId: string, attemptId: string, asTeamId?: string): Observable<ExistingCurrentAnswer|null> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${itemId}/current-answer`, { params }).pipe(
      decodeSnakeCase(currentAnswerSchema),
      map(a => (a.type === null ? null : a)), // convert "no current answer" response to "null"
    );
  }

  update(itemId: string, attemptId: string, body: UpdateCurrentAnswerBody, asTeamId?: string): Observable<void> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http
      .put<ActionResponse<unknown>>(`${this.config.apiUrl}/items/${itemId}/attempts/${attemptId}/answers/current`, body, { params })
      .pipe(map(assertSuccess), map(() => undefined));
  }

}
