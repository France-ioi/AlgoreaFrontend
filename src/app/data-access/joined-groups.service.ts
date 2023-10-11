import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { SortOptions, sortOptionsToHTTP } from 'src/app/data-access/sort-options';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { dateDecoder } from 'src/app/utils/decoders';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const groupMembershipDecoder = pipe(
  D.struct({
    action: D.literal('invitation_accepted', 'join_request_accepted', 'joined_by_code', 'joined_by_badge', 'added_directly'),
    group: D.struct({
      description: D.nullable(D.string),
      id: D.string,
      name: D.string,
      type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'Base', 'Session'),
    }),
    memberSince: D.nullable(dateDecoder),
    isMembershipLocked: D.boolean,
  }),
  D.intersect(
    D.partial({
      canLeaveTeam: D.literal('free_to_leave', 'frozen_membership', 'would_break_entry_conditions'),
    })
  ),
);

export type GroupMembership = D.TypeOf<typeof groupMembershipDecoder>;

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {

  constructor(private http: HttpClient) {}

  getJoinedGroups(sort: SortOptions): Observable<GroupMembership[]> {
    return this.http
      .get(`${appConfig.apiUrl}/current-user/group-memberships`, { params: sortOptionsToHTTP(sort) })
      .pipe(
        decodeSnakeCase(D.array(groupMembershipDecoder)),
        map(memberships => memberships.filter(membership => membership.group.type !== 'Base')),
      );
  }

}
