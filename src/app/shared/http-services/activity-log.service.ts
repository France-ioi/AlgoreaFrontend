import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from '../helpers/decoders';

const activityLogDecoder = pipe(
  D.struct({
    activityType: D.literal('result_started', 'submission', 'result_validated', 'saved_answer', 'current_answer'),
    at: dateDecoder,
    attemptId: D.string,
    item: D.struct({
      id: D.string,
      string: D.struct({
        title: D.string,
      }),
      type: D.literal('Chapter', 'Task', 'Course', 'Skill'),
    }),
    participant: D.struct({
      id: D.string,
      name: D.string,
      type: D.literal('Team', 'User'),
    }),
  }),
  D.intersect(
    D.partial({
      answerId: D.string,
      score: D.number,
      user: pipe(
        D.struct({
          id: D.string,
          login: D.string,
        }),
        D.intersect(
          D.partial({
            firstName: D.nullable(D.string),
            lastName: D.nullable(D.string),
          }),
        ),
      ),
    }),
  ),
);

export type ActivityLog = D.TypeOf<typeof activityLogDecoder>;

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  constructor(private http: HttpClient) { }

  getActivityLog(
    itemId: string,
    watchedGroupId?: string,
  ): Observable<ActivityLog[]> {
    let params = new HttpParams();
    params = params.set('limit', '20');

    if (watchedGroupId) {
      params = params.set('watched_group_id', watchedGroupId);
    }

    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${itemId}/log`, { params: params })
      .pipe(decodeSnakeCase(D.array(activityLogDecoder)));
  }

  getAllActivityLog(
    watchedGroupId?: string,
  ): Observable<ActivityLog[]> {
    let params = new HttpParams();
    params = params.set('limit', '20');

    if (watchedGroupId) {
      params = params.set('watched_group_id', watchedGroupId);
    }

    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/log`, { params: params })
      .pipe(decodeSnakeCase(D.array(activityLogDecoder)));
  }
}
