import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';

interface RawResult {
  id: string, // attempt id
  latest_activity_at: string,
  started_at: string|null,
  score_computed: number,
  validated: boolean,
}

export interface Result {
  attemptId: string,
  latestActivityAt: Date,
  startedAt: Date|null,
  score: number,
  validated: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GetResultsService {

  constructor(private http: HttpClient) {}

  getResults(item: FullItemRoute): Observable<Result[]> {
    return this.http
      .get<RawResult[]>(`${appConfig.apiUrl}/items/${item.id}/attempts`, {
        params: isRouteWithSelfAttempt(item) ? { attempt_id: item.attemptId } : { parent_attempt_id: item.parentAttemptId }
      })
      .pipe(
        map(results => results.map(r => ({
          attemptId: r.id,
          latestActivityAt: new Date(r.latest_activity_at),
          startedAt: r.started_at === null ? null : new Date(r.started_at),
          score: r.score_computed,
          validated: r.validated,
        }))),
      );
  }

}
