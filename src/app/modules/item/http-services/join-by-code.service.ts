import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/shared/http-services/action-response';

interface RawGroupInfos {
  managers: {
    id: string,
    login: string,
    first_name: string|null,
    last_name: string|null,
  }[],
  name: string,
  require_lock_membership_approval_until: string|null,
  require_personal_info_access_approval: string|null,
  require_watch_approval: boolean,
  root_activity_id: string|null,
  root_skill_id: string|null,
}

export interface GroupInfos {
  managers: {
    id: string,
    login: string,
    firstName: string|null,
    lastName: string|null,
  }[],
  name: string,
  requireLockMembershipApprovalUntil: string|null,
  requirePersonalInfoAccessApproval: string|null,
  requireWatchApproval: boolean,
  rootActivityId: string|null,
  rootSkillId: string|null,
}

export type InvalidCodeReason = 'no_group'|'frozen_membership'|'already_member'|'conflicting_team_participation'|'team_conditions_not_met';

@Injectable({
  providedIn: 'root'
})
export class JoinByCodeService {

  constructor(private http: HttpClient) { }

  checkCodeValidity(code: string): Observable<{valid: false, reason: InvalidCodeReason} | {valid: true, group: GroupInfos}> {
    let params = new HttpParams();
    params = params.set('code', code);
    return this.http
      .get<{valid: false, reason: InvalidCodeReason}|{valid: true, group: RawGroupInfos}>(`${appConfig().apiUrl}/groups/is-code-valid`,
        { params: params })
      .pipe(map(r => (r.valid ? {
        valid: true,
        group: {
          managers: r.group.managers.map(m => ({
            id: m.id,
            login: m.login,
            firstName: m.first_name,
            lastName: m.last_name,
          })),
          name: r.group.name,
          requireLockMembershipApprovalUntil: r.group.require_lock_membership_approval_until,
          requirePersonalInfoAccessApproval: r.group.require_personal_info_access_approval,
          requireWatchApproval: r.group.require_watch_approval,
          rootActivityId: r.group.root_activity_id,
          rootSkillId: r.group.root_skill_id,
        }
      } : { valid: false, reason: r.reason })));
  }

}
