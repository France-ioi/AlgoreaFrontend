import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { groupManagershipLevelSchema } from '../models/group-management';

const typeSchema = z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base' ]);

const groupChildSchema = z.object({
  currentUserIsManager: z.boolean(),
  grade: z.number(),
  id: z.string(),
  isOpen: z.boolean(),
  isPublic: z.boolean(),
  name: z.string(),
  type: typeSchema,
  isEmpty: z.boolean(),
  currentUserCanGrantGroupAccess: z.boolean().optional(),
  currentUserCanManage: groupManagershipLevelSchema.optional(),
  currentUserCanWatchMembers: z.boolean().optional(),
  userCount: z.number().optional(),
});

export type GroupChild = z.infer<typeof groupChildSchema>;
export type GroupType = z.infer<typeof typeSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupChildrenService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getGroupChildren(
    groupId: string,
    sort: string[] = [],
    typesInclude: GroupType[] = [],
    typesExclude: GroupType[] = [],
    options?: { limit?: number, fromId?: string },
  ): Observable<GroupChild[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (typesInclude.length > 0) params = params.set('types_include', typesInclude.join(','));
    if (typesExclude.length > 0) params = params.set('types_exclude', typesExclude.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/children`, { params: params })
      .pipe(
        decodeSnakeCase(z.array(groupChildSchema))
      );
  }
}
