import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { withGrade, withGroupId, userBaseSchema } from '../groups/models/user';

const parentsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string()
  })
);

const teamDescendantsSchema = z.array(
  z.object({
    grade: z.number(),
    id: z.string(),
    members: z.array(withGrade(withGroupId(userBaseSchema))),
    name: z.string(),
    parents: parentsSchema,
  })
);

type TeamDescendants = z.infer<typeof teamDescendantsSchema>;

const userDescendantsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    parents: parentsSchema,
    user: withGrade(userBaseSchema),
  })
);

type UserDescendants = z.infer<typeof userDescendantsSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupDescendantsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getUserDescendants(groupId: string, options?: { sort?: string[], limit?: number, fromId?: string }): Observable<UserDescendants> {
    let params = new HttpParams();
    if (options?.sort && options.sort.length > 0) params = params.set('sort', options.sort.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/user-descendants`, { params: params })
      .pipe(
        decodeSnakeCase(userDescendantsSchema),
      );
  }

  getTeamDescendants(groupId: string, options?: { sort: string[] }): Observable<TeamDescendants> {
    let params = new HttpParams();
    if (options?.sort && options.sort.length > 0) params = params.set('sort', options.sort.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/team-descendants`, { params: params })
      .pipe(
        decodeSnakeCase(teamDescendantsSchema),
      );
  }
}
