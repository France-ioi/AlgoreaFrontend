import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { dateDecoder } from '../utils/decoders';
import { SECONDS } from '../utils/duration';
import { requestTimeout } from '../interceptors/interceptor_common';

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
      type: D.literal('Chapter', 'Task', 'Skill'),
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

const logServicesTimeout = 10 * SECONDS; // log services may be very slow
const logDefaultLimit = 20;

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  constructor(private http: HttpClient) { }

  getActivityLog(itemId: string, options?: {
    watchedGroupId?: string,
    limit?: number,
    pagination?: {
      fromItemId: string,
      fromParticipantId: string,
      fromAttemptId: string,
      fromAnswerId: string,
      fromActivityType: string,
    },
  }): Observable<ActivityLog[]> {
    let params = new HttpParams();
    const limit = options?.limit ?? logDefaultLimit;
    params = params.set('limit', limit.toString());

    if (options?.watchedGroupId !== undefined) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }

    if (options?.pagination !== undefined) {
      params = params.set('from.item_id', options.pagination.fromItemId);
      params = params.set('from.answer_id', options.pagination.fromAnswerId);
      params = params.set('from.participant_id', options.pagination.fromParticipantId);
      params = params.set('from.attempt_id', options.pagination.fromAttemptId);
      params = params.set('from.activity_type', options.pagination.fromActivityType);
    }

    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${itemId}/log`, {
        params: params,
        context: new HttpContext().set(requestTimeout, logServicesTimeout),
      })
      .pipe(decodeSnakeCase(D.array(activityLogDecoder)));
  }

  getAllActivityLog(
    watchedGroupId?: string,
    options?: {
      limit?: number,
      pagination?: {
        fromItemId: string,
        fromParticipantId: string,
        fromAttemptId: string,
        fromAnswerId: string,
        fromActivityType: string,
      },
    }
  ): Observable<ActivityLog[]> {
    let params = new HttpParams();
    const limit = options?.limit ?? logDefaultLimit;
    params = params.set('limit', limit.toString());

    if (watchedGroupId) {
      params = params.set('watched_group_id', watchedGroupId);
    }

    if (options?.pagination !== undefined) {
      params = params.set('from.item_id', options.pagination.fromItemId);
      params = params.set('from.answer_id', options.pagination.fromAnswerId);
      params = params.set('from.participant_id', options.pagination.fromParticipantId);
      params = params.set('from.attempt_id', options.pagination.fromAttemptId);
      params = params.set('from.activity_type', options.pagination.fromActivityType);
    }

    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/log`, {
        params: params,
        context: new HttpContext().set(requestTimeout, logServicesTimeout),
      })
      .pipe(decodeSnakeCase(D.array(activityLogDecoder)));
  }
}
