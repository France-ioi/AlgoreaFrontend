import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { dateDecoder } from '../utils/decoders';

const managerDecoder = D.struct({
  id: D.string,
  firstName: D.nullable(D.string),
  lastName: D.nullable(D.string),
  login: D.string,
});

const groupDecoder = D.struct({
  name: D.string,
  requireLockMembershipApprovalUntil: D.nullable(dateDecoder),
  requirePersonalInfoAccessApproval: D.literal('none', 'view', 'edit'),
  requireWatchApproval: D.boolean,
  rootActivityId: D.nullable(D.string),
  rootSkillId: D.nullable(D.string),
  managers: D.array(managerDecoder),
});

const invalidReasonDecoder = D.literal(
  'no_group',
  'frozen_membership',
  'already_member',
  'conflicting_team_participation',
  'team_conditions_not_met'
);

const isCodeValidDecoder = pipe(
  D.struct({
    valid: D.boolean,
  }),
  D.intersect(
    D.partial({
      group: groupDecoder,
      reason: invalidReasonDecoder,
    }),
  ),
);

export type IsCodeValid = D.TypeOf<typeof isCodeValidDecoder>;

export type InvalidCodeReason = D.TypeOf<typeof invalidReasonDecoder>;

@Injectable({
  providedIn: 'root'
})
export class JoinByCodeService {

  constructor(private http: HttpClient) { }

  checkCodeValidity(code: string): Observable<IsCodeValid> {
    let params = new HttpParams();
    params = params.set('code', code);
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/is-code-valid`,
        { params: params })
      .pipe(
        decodeSnakeCase(isCodeValidDecoder),
      );
  }

  joinGroupThroughCode(code: string, approvals: string[] = []): Observable<void> {
    let params = new HttpParams();
    params = params.set('code', code).set('approvals', approvals.join(','));
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/current-user/group-memberships/by-code`, null, { params: params })
      .pipe(
        map(assertSuccess)
      );
  }
}
