import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

const groupProgressesSchema = z.array(
  z.object({
    averageScore: z.number(),
    avgHintsRequested: z.number(),
    avgSubmissions: z.number(),
    avgTimeSpent: z.number(),
    groupId: z.string(),
    itemId: z.string(),
    validationRate: z.number()
  })
);

export type GroupProgresses = z.infer<typeof groupProgressesSchema>;

const participantProgressesSchema = z.array(
  z.object({
    groupId: z.string(),
    hintsRequested: z.number(),
    itemId: z.string(),
    latestActivityAt: z.coerce.date().nullable(),
    score: z.number(),
    submissions: z.number(),
    timeSpent: z.number(),
    validated: z.boolean()
  })
);

export type ParticipantProgresses = z.infer<typeof participantProgressesSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupProgressService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  readonly pageSizes = {
    users: { default: 50, max: 1000 },
    teams: { default: 50, max: 1000 },
    groups: { default: 10, max: 20 },
  } as const;

  getUsersProgress(
    groupId: string,
    parentItemIds: string[],
    options?: {
      limit?: number,
      fromId?: string,
    },
  ): Observable<ParticipantProgresses> {
    let params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);

    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/user-progress`, { params: params })
      .pipe(
        decodeSnakeCase(participantProgressesSchema),
      );
  }

  getTeamsProgress(
    groupId: string,
    parentItemIds: string[],
    options?: {
      limit?: number,
      fromId?: string,
    },
  ): Observable<ParticipantProgresses> {
    let params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);

    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/team-progress`, { params: params })
      .pipe(
        decodeSnakeCase(participantProgressesSchema),
      );
  }

  getGroupsProgress(
    groupId: string,
    parentItemIds: string[],
    options?: {
      limit?: number,
      fromId?: string,
    },
  ): Observable<GroupProgresses> {
    let params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);

    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/group-progress`, { params: params })
      .pipe(
        decodeSnakeCase(groupProgressesSchema),
      );
  }
}
