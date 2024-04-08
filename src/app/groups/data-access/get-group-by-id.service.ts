import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/utils/decoders';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { groupCodeDecoder } from '../models/group-code';
import { groupManagershipDecoder } from '../models/group-management';

const groupShortInfo = D.struct({
  id: D.string,
  name: D.string,
});

const groupApprovalsDecoder = D.struct({
  requireLockMembershipApprovalUntil: D.nullable(dateDecoder),
  requirePersonalInfoAccessApproval: D.literal('none', 'view', 'edit'),
  requireWatchApproval: D.boolean,
});

const decoder = pipe(
  D.struct({
    id: D.string,
    type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base'),
    name: D.string,
    description: D.nullable(D.string),
    isMembershipLocked: D.boolean,
    isOpen: D.boolean,
    isPublic: D.boolean,
    createdAt: D.nullable(dateDecoder),
    grade: D.number,

    currentUserMembership: D.literal('none', 'direct', 'descendant'),
    currentUserManagership: D.literal('none', 'direct', 'ancestor', 'descendant'),
    ancestorsCurrentUserIsManagerOf: D.array(groupShortInfo),
    descendantsCurrentUserIsManagerOf: D.array(groupShortInfo),
    descendantsCurrentUserIsMemberOf: D.array(groupShortInfo),

    rootActivityId: D.nullable(D.string),
    rootSkillId: D.nullable(D.string),
    openActivityWhenJoining: D.boolean,
  }),
  D.intersect(groupCodeDecoder),
  D.intersect(groupManagershipDecoder),
  D.intersect(groupApprovalsDecoder),
);

export type Group = D.TypeOf<typeof decoder>;
export type GroupShortInfo = D.TypeOf<typeof groupShortInfo>;
export type GroupApprovals = D.TypeOf<typeof groupApprovalsDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetGroupByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Group> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${id}`).pipe(
      decodeSnakeCase(decoder),
    );
  }

}
