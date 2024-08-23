import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { Result, attemptResultSchema, resultFromFetchedResult } from '../models/attempts';

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
        decodeSnakeCaseZod(z.array(attemptResultSchema)),
        map(results => results.map(resultFromFetchedResult)),
      );
  }

}
