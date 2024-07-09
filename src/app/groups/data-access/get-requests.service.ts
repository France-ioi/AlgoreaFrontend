import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { map } from 'rxjs/operators';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase, decodeSnakeCaseZod } from '../../utils/operators/decode';
import { dateDecoder, dateSchema } from 'src/app/utils/decoders';
import { requestTimeout } from 'src/app/interceptors/interceptor_common';
import { SECONDS } from 'src/app/utils/duration';
import { groupApprovalsSchema } from 'src/app/groups/models/group-approvals';
import { z } from 'zod';

const userDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
      grade: D.nullable(D.number),
    }),
  ),
);

const groupPendingRequestDecoder = D.struct({
  at: D.nullable(dateDecoder),
  group: D.struct({
    id: D.string,
    name: D.string,
  }),
  type: D.literal('join_request', 'leave_request'),
  user: userDecoder,
});

const groupInvitationsSchema = z.array(
  z.object({
    at: dateSchema,
    group: z.object({
      id: z.string(),
      name: z.string(),
      description: z.nullable(z.string()),
      type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]),
    }).and(groupApprovalsSchema),
    groupId: z.string(),
    invitingUser: z.nullable(z.object({
      id: z.string(),
      firstName: z.nullable(z.string()),
      lastName: z.nullable(z.string()),
      login: z.string(),
    })),
  }),
);

export interface PendingRequest {
  at: Date|null,
  user: null | {
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

export interface GroupPendingRequest extends PendingRequest {
  user: {
    id: string,
    login: string,
    firstName: string|null,
    lastName: string|null,
    grade: number|null,
  },
}

export type GroupInvitations = z.infer<typeof groupInvitationsSchema>;
export type GroupInvitation = GroupInvitations[0];

const groupInvitationsServiceTimeout = 60*SECONDS;

@Injectable({
  providedIn: 'root'
})
export class GetRequestsService {

  constructor(private http: HttpClient) {}

  getGroupPendingRequests(
    groupId?: string,
    includeSubgroup : boolean = false,
    sort: string[] = [],
  ): Observable<GroupPendingRequest[]> {
    let params = new HttpParams();
    if (groupId) {
      params = params.set('group_id', groupId);
      if (includeSubgroup) params = params.set('include_descendant_groups', '1');
    }
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/user-requests`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(groupPendingRequestDecoder)),
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
      .get<unknown>(`${appConfig.apiUrl}/current-user/group-invitations`, {
        params: params,
        context: new HttpContext().set(requestTimeout, groupInvitationsServiceTimeout),
      })
      .pipe(decodeSnakeCaseZod(groupInvitationsSchema));
  }
}
