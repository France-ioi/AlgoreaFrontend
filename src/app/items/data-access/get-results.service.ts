import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod/v4';
import { Result, attemptResultSchema, resultFromFetchedResult } from '../models/attempts';

@Injectable({
  providedIn: 'root'
})
export class GetResultsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getResults(item: FullItemRoute): Observable<Result[]> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${item.id}/attempts`, {
        params: isRouteWithSelfAttempt(item) ? { attempt_id: item.attemptId } : { parent_attempt_id: item.parentAttemptId },
      })
      .pipe(
        decodeSnakeCase(z.array(attemptResultSchema)),
        map(results => results.map(resultFromFetchedResult)),
      );
  }

}
