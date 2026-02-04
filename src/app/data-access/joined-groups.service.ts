import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { SortOptions, sortOptionsToHTTP } from 'src/app/data-access/sort-options';
import z from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';
import { infoAndWatchGroupApprovalsSchema } from '../groups/models/group-approvals';

const groupMembershipSchema = z.object({
  action: z.enum([ 'invitation_accepted', 'join_request_accepted', 'joined_by_code', 'joined_by_badge', 'added_directly' ]),
  group: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Base', 'Session' ]),
  }).and(infoAndWatchGroupApprovalsSchema),
  memberSince: z.coerce.date().nullable(),
  isMembershipLocked: z.boolean(),
  canLeaveTeam: z.enum([ 'free_to_leave', 'frozen_membership', 'would_break_entry_conditions' ]).optional(),
});

export type GroupMembership = z.infer<typeof groupMembershipSchema>;

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getJoinedGroups(sort: SortOptions): Observable<GroupMembership[]> {
    return this.http
      .get(`${this.config.apiUrl}/current-user/group-memberships`, { params: sortOptionsToHTTP(sort) })
      .pipe(
        decodeSnakeCase(z.array(groupMembershipSchema)),
        map(memberships => memberships.filter(membership => membership.group.type !== 'Base')),
      );
  }

  getJoinedGroupsWithPersonalInfoAccess(): Observable<GroupMembership['group'][]> {
    return this.http
      .get(`${this.config.apiUrl}/current-user/group-memberships`, { params: { only_requiring_personal_info_access_approval: 1 } })
      .pipe(
        decodeSnakeCase(z.array(groupMembershipSchema)),
        map(memberships => memberships.map(m => m.group)),
        map(memberships => memberships.filter(group => group.type !== 'Base')),
      );
  }

}
