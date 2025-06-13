import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

export const answerSchema = z.object({
  answer: z.string().nullable(),
  attemptId: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.coerce.date(),
  gradedAt: z.coerce.date().nullable(),
  id: z.string(),
  itemId: z.string(),
  score: z.number().nullable(),
  state: z.string().nullable(),
  type: z.enum([ 'Submission', 'Saved', 'Current' ]),
});

export type Answer = z.infer<typeof answerSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetAnswerService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(answerId: string): Observable<Answer> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/answers/${answerId}`)
      .pipe(decodeSnakeCase(answerSchema));
  }

  getBest(itemId: string, options?: { watchedGroupId?: string }): Observable<Answer> {
    let params = new HttpParams();
    if (options?.watchedGroupId) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemId}/best-answer`, { params })
      .pipe(decodeSnakeCase(answerSchema));
  }

}
