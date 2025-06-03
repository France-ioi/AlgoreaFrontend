import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { manageTypeSchema } from 'src/app/data-access/managed-groups.service';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';

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
  currentUserCanManage: manageTypeSchema.optional(),
  currentUserCanWatchMembers: z.boolean().optional(),
  userCount: z.number().optional(),
});

export type GroupChild = z.infer<typeof groupChildSchema>;
export type GroupType = z.infer<typeof typeSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupChildrenService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getGroupChildren(
    groupId: string,
    sort: string[] = [],
    typesInclude: GroupType[] = [],
    typesExclude: GroupType[] = [],
  ): Observable<GroupChild[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (typesInclude.length > 0) params = params.set('types_include', typesInclude.join(','));
    if (typesExclude.length > 0) params = params.set('types_exclude', typesExclude.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/children`, { params: params })
      .pipe(
        decodeSnakeCaseZod(z.array(groupChildSchema))
      );
  }
}
