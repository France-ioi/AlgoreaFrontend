import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { SECONDS } from '../utils/duration';
import { requestTimeout } from '../interceptors/interceptor_common';
import { itemTypeSchema } from '../items/models/item-type';
import { participantTypeSchema } from '../groups/models/group-types';
import { userBaseSchema, withId } from '../groups/models/user';
import { ThreadId } from '../forum/models/threads';

const activityLogsSchema = z.array(
  z.object({
    activityType: z.enum([ 'result_started', 'submission', 'result_validated', 'saved_answer', 'current_answer' ]),
    at: z.coerce.date(),
    attemptId: z.string(),
    canWatchAnswer: z.boolean().optional(),
    item: z.object({
      id: z.string(),
      string: z.object({
        title: z.string()
      }),
      type: itemTypeSchema
    }),
    participant: z.object({
      id: z.string(),
      name: z.string(),
      type: participantTypeSchema,
    }),
    answerId: z.string().optional(),
    score: z.number().optional(),
    user: withId(userBaseSchema).optional(),
  })
);

export type ActivityLogs = z.infer<typeof activityLogsSchema>;

const logServicesTimeout = 15 * SECONDS; // log services may be very slow
const logDefaultLimit = 20;

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

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
  }): Observable<ActivityLogs> {
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
      .get<unknown[]>(`${this.config.apiUrl}/items/${itemId}/log`, {
        params: params,
        context: new HttpContext().set(requestTimeout, logServicesTimeout),
      })
      .pipe(decodeSnakeCase(activityLogsSchema));
  }

  getAllActivityLog(
    options?: {
      watchedGroupId?: string,
      limit?: number,
      pagination?: {
        fromItemId: string,
        fromParticipantId: string,
        fromAttemptId: string,
        fromAnswerId: string,
        fromActivityType: string,
      },
    }
  ): Observable<ActivityLogs> {
    let params = new HttpParams();
    const limit = options?.limit ?? logDefaultLimit;
    params = params.set('limit', limit.toString());

    if (options?.watchedGroupId) {
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
      .get<unknown[]>(`${this.config.apiUrl}/items/log`, {
        params: params,
        context: new HttpContext().set(requestTimeout, logServicesTimeout),
      })
      .pipe(decodeSnakeCase(activityLogsSchema));
  }

  getThreadActivityLog(threadId: ThreadId, options?: {
    limit?: number,
    from?: { attemptId: string, answerId: string, activityType: string },
  }): Observable<ActivityLogs> {
    let params = new HttpParams();
    const limit = options?.limit ?? logDefaultLimit;
    params = params.set('limit', limit.toString());

    if (options?.from !== undefined) {
      params = params.set('from.attempt_id', options.from.attemptId);
      params = params.set('from.answer_id', options.from.answerId);
      params = params.set('from.activity_type', options.from.activityType);
    }
    return this.http
      .get<unknown[]>(`${this.config.apiUrl}/items/${threadId.itemId}/participant/${threadId.participantId}/thread/log`, {
        params: params,
        context: new HttpContext().set(requestTimeout, logServicesTimeout),
      })
      .pipe(decodeSnakeCase(activityLogsSchema));
  }
}
