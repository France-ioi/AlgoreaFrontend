import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { isRouteWithAttempt, ItemRoute } from 'src/app/shared/helpers/item-route';

type Attempt = { attemptId: string } | { parentAttemptId: string };

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

  getResults(item: ItemRoute): Observable<Result[]> {
    return this.http
      .get<RawResult[]>(`${environment.apiUrl}/items/${item.id}/attempts`, {
        params: isRouteWithAttempt(item) ? { attempt_id: item.attemptId } : { parent_attempt_id: item.parentAttemptId }
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
