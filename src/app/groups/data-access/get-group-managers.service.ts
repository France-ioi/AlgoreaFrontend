import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { userBaseSchema } from 'src/app/groups/models/user';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { groupManagershipLevelSchema } from '../models/group-management';

export const managerSchema = z.object({
  id: z.string(),
  name: z.string(),
  canManage: groupManagershipLevelSchema,
  canGrantGroupAccess: z.boolean(),
  canWatchMembers: z.boolean(),
}).merge(userBaseSchema.partial());

export type Manager = z.infer<typeof managerSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupManagersService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getGroupManagers(
    groupId: string,
    options?: {
      sort?: string[],
      limit?: number,
      fromId?: string,
    },
  ): Observable<Manager[]> {
    let params = new HttpParams();
    if (options?.sort) params = params.set('sort', options.sort.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);

    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/managers`, { params: params }).pipe(
        decodeSnakeCase(z.array(managerSchema)),
      );
  }
}
