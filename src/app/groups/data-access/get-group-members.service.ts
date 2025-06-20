import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { userBaseSchema, withGrade, withGroupId } from '../models/user';

const groupMembersSchema = z.array(
  z.object({
    id: z.string(),
    user: withGrade(withGroupId(userBaseSchema)),
    action: z.enum([ 'invitation_accepted', 'join_request_accepted', 'joined_by_code', 'joined_by_badge', 'added_directly' ]).optional(),
    memberSince: z.coerce.date().optional(),
  })
);

export type GroupMembers = z.infer<typeof groupMembersSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupMembersService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getGroupMembers(
    groupId: string,
    sort: string[] = [],
    limit?: number,
    fromId?: string,
  ): Observable<GroupMembers> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (limit !== undefined) params = params.set('limit', limit.toString());
    if (fromId !== undefined) params = params.set('from.id', fromId);
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/members`, { params: params })
      .pipe(
        decodeSnakeCase(groupMembersSchema),
      );
  }
}
