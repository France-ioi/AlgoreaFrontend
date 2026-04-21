import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from 'src/app/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { PermissionsToken } from './permissions-token.service';

const scoreDistributionEntrySchema = z.object({
  score: z.number(),
  pctUsersAbove: z.number(),
  pctByTime: z.record(z.string(), z.number()),
});

const taskStatsSchema = z.object({
  userCount: z.number(),
  medianTimeSpent: z.number().nullable(),
  medianTimeToValidate: z.number().nullable(),
  medianDropoutTimeLowScore: z.number().nullable(),
  avgScore: z.number().nullable(),
  scoreDistribution: z.array(scoreDistributionEntrySchema),
});

export type TaskStats = z.infer<typeof taskStatsSchema>;
export type ScoreDistributionEntry = z.infer<typeof scoreDistributionEntrySchema>;

@Injectable({
  providedIn: 'root',
})
export class GetTaskStatsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  get(permissionsToken: PermissionsToken): Observable<TaskStats> {
    const slsApiUrl = this.config.slsApiUrl;
    if (!slsApiUrl) {
      throw new Error('SLS API URL is not configured');
    }

    return this.http.get<unknown>(`${slsApiUrl}/task-stats`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Authorization: `Bearer ${permissionsToken}` },
    }).pipe(
      decodeSnakeCase(taskStatsSchema),
    );
  }
}
