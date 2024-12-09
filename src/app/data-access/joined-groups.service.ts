import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { SortOptions, sortOptionsToHTTP } from 'src/app/data-access/sort-options';
import z from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const groupMembershipSchema = z.object({
  action: z.union([
    z.literal('invitation_accepted'),
    z.literal('join_request_accepted'),
    z.literal('joined_by_code'),
    z.literal('joined_by_badge'),
    z.literal('added_directly'),
  ]),
  group: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.union([
      z.literal('Class'),
      z.literal('Team'),
      z.literal('Club'),
      z.literal('Friends'),
      z.literal('Other'),
      z.literal('Base'),
      z.literal('Session'),
    ]),
  }),
  memberSince: z.coerce.date().nullable(),
  isMembershipLocked: z.boolean(),
}).and(z.object({
  canLeaveTeam: z.union([ z.literal('free_to_leave'), z.literal('frozen_membership'), z.literal('would_break_entry_conditions') ]),
}));

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
