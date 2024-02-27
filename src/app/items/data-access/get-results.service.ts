import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { userBaseSchema, withGroupId } from 'src/app/groups/models/user';

export interface Result {
  attemptId: string,
  latestActivityAt: Date,
  startedAt: Date|null,
  score: number,
  validated: boolean,
}

const resultsSchema = z.array(
  z.object({
    id: z.string(),
    allowsSubmissionsUntil: z.coerce.date(),
    createdAt: z.coerce.date(),
    endedAt: z.coerce.date().nullable(),
    latestActivityAt: z.coerce.date(),
    scoreComputed: z.number(),
    startedAt: z.coerce.date().nullable(),
    validated: z.boolean(),
    userCreator: withGroupId(userBaseSchema).optional(),
  })
);

@Injectable({
  providedIn: 'root'
})
export class GetResultsService {

  constructor(private http: HttpClient) {}

  getResults(item: FullItemRoute): Observable<Result[]> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${item.id}/attempts`, {
        params: isRouteWithSelfAttempt(item) ? { attempt_id: item.attemptId } : { parent_attempt_id: item.parentAttemptId },
      })
      .pipe(
        decodeSnakeCaseZod(resultsSchema),
        map(results => results.map(r => ({
          attemptId: r.id,
          latestActivityAt: r.latestActivityAt,
          startedAt: r.startedAt,
          score: r.scoreComputed,
          validated: r.validated,
        }))),
      );
  }

}
