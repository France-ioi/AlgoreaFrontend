import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

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

  getResults(itemId: string, attempt: Attempt): Observable<Result[]> {
    return this.http
      .get<RawResult[]>(`${environment.apiUrl}/items/${itemId}/attempts`, {
        params: 'parentAttemptId' in attempt ? { parent_attempt_id: attempt.parentAttemptId } : { attempt_id: attempt.attemptId }
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
