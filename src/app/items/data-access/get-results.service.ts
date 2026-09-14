import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FullItemRoute, isRouteWithParentAttempt, isRouteWithSelfAttempt } from 'src/app/models/routing/item-route';
import { APPCONFIG } from 'src/app/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { Result, attemptResultSchema, resultFromFetchedResult } from '../models/attempts';

@Injectable({
  providedIn: 'root'
})
export class GetResultsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getResults(item: FullItemRoute): Observable<Result[]> {
    // Same precedence as `resultsFetchKey`: parent attempt is the authoritative list context.
    // Use `isRouteWithSelfAttempt` so the `a=new` sentinel is never forwarded as `attempt_id`.
    let params: Record<string, string>;
    if (isRouteWithParentAttempt(item)) {
      params = { parent_attempt_id: item.parentAttemptId };
    } else if (isRouteWithSelfAttempt(item)) {
      params = { attempt_id: item.attemptId };
    } else {
      throw new Error('Cannot fetch results without a parent or self attempt');
    }
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${item.id}/attempts`, { params })
      .pipe(
        decodeSnakeCase(z.array(attemptResultSchema)),
        map(results => results.map(resultFromFetchedResult)),
      );
  }

}
