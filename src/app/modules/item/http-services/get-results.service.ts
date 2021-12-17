import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../../shared/helpers/decoders';

export interface Result {
  attemptId: string,
  latestActivityAt: Date,
  startedAt: Date|null,
  score: number,
  validated: boolean,
}

const userDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
    })
  ),
);

const resultDecoder = pipe(
  D.struct({
    id: D.string,
    allowsSubmissionsUntil: dateDecoder,
    createdAt: dateDecoder,
    endedAt: D.nullable(dateDecoder),
    latestActivityAt: dateDecoder,
    scoreComputed: D.number,
    startedAt: D.nullable(dateDecoder),
    validated: D.boolean,
  }),
  D.intersect(
    D.partial({
      userCreator: userDecoder,
    }),
  ),
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
        decodeSnakeCase(D.array(resultDecoder)),
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
