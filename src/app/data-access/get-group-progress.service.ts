import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../app.config';
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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

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
  ): Observable<ParticipantProgresses> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/team-progress`, { params: params })
      .pipe(
        decodeSnakeCase(participantProgressesSchema),
      );
  }

  getGroupsProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<GroupProgresses> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/group-progress`, { params: params })
      .pipe(
        decodeSnakeCase(groupProgressesSchema),
      );
  }
}
