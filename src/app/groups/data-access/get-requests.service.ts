import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { decodeSnakeCaseZod } from '../../utils/operators/decode';
import { groupApprovalsSchema } from 'src/app/groups/models/group-approvals';
import { z } from 'zod';
import { map } from 'rxjs/operators';
import { userBaseSchema, withGrade, withGroupId, withId } from 'src/app/groups/models/user';

const groupPendingRequestSchema = z.array(
  z.object({
    at: z.coerce.date(),
    group: z.object({
      id: z.string(),
      name: z.string(),
    }),
    type: z.enum([ 'join_request', 'leave_request' ]),
    user: withGrade(withGroupId(userBaseSchema)),
  })
);

const groupInvitationsSchema = z.array(
  z.object({
    at: z.coerce.date(),
    group: z.object({
      id: z.string(),
      name: z.string(),
      description: z.nullable(z.string()),
      type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]),
    }).and(groupApprovalsSchema),
    groupId: z.string(),
    invitingUser: z.nullable(withId(userBaseSchema)),
  }),
);

export interface PendingRequest {
  at: Date|null,
  user: {
    id: string,
    login: string,
    firstName: string|null,
    lastName: string|null,
  },
  group: {
    id: string,
    name: string,
  },
}

export type GroupInvitations = z.infer<typeof groupInvitationsSchema>;
export type GroupInvitation = GroupInvitations[0];

@Injectable({
  providedIn: 'root'
})
export class GetRequestsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getGroupPendingRequests(
    groupId?: string,
    includeSubgroup: boolean = false,
    sort: string[] = [],
  ): Observable<PendingRequest[]> {
    let params = new HttpParams();
    if (groupId) {
      params = params.set('group_id', groupId);
      if (includeSubgroup) params = params.set('include_descendant_groups', '1');
    }
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/user-requests`, { params: params })
      .pipe(
        decodeSnakeCaseZod(groupPendingRequestSchema),
        map(pendingRequests => pendingRequests.map(r => ({
          at: r.at,
          group: r.group,
          user: {
            id: r.user.groupId,
            login: r.user.login,
            firstName: r.user.firstName || null,
            lastName: r.user.lastName || null,
            grade: r.user.grade || null,
          }
        })))
      );
  }

  getGroupInvitations(
    sort: string[] = [],
  ): Observable<GroupInvitations> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<unknown>(`${this.config.apiUrl}/current-user/group-invitations`, { params: params, })
      .pipe(decodeSnakeCaseZod(groupInvitationsSchema));
  }
}
