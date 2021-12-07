import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  get(
    itemId: string,
    params?: { attempt_id?: string, parent_attempt_id?: string, limit?: number, sort?: Array<'id' | '-id'> },
  ): Observable<Result[]> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/attempts`, {
        params: new HttpParams({ fromObject: params }),
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

  getResults(item: FullItemRoute): Observable<Result[]> {
    return this.get(item.id, isRouteWithSelfAttempt(item) ? { attempt_id: item.attemptId } : { parent_attempt_id: item.parentAttemptId });
  }

}
