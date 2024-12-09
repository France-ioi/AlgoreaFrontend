import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { SortOptions, sortOptionsToHTTP } from 'src/app/data-access/sort-options';
import z from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const groupMembershipSchema = z.object({
  action: z.enum([ 'invitation_accepted', 'join_request_accepted', 'joined_by_code', 'joined_by_badge', 'added_directly' ]),
  group: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Base', 'Session' ]),
  }),
  memberSince: z.coerce.date().nullable(),
  isMembershipLocked: z.boolean(),
}).and(z.object({
  canLeaveTeam: z.enum([ 'free_to_leave', 'frozen_membership', 'would_break_entry_conditions' ]),
}).partial());

export type GroupMembership = z.infer<typeof groupMembershipSchema>;

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {

  constructor(private http: HttpClient) {}

  getJoinedGroups(sort: SortOptions): Observable<GroupMembership[]> {
    return this.http
      .get(`${appConfig.apiUrl}/current-user/group-memberships`, { params: sortOptionsToHTTP(sort) })
      .pipe(
        decodeSnakeCaseZod(z.array(groupMembershipSchema)),
        map(memberships => memberships.filter(membership => membership.group.type !== 'Base')),
      );
  }

}
