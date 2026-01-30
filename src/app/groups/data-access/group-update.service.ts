import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { GroupApprovals } from 'src/app/groups/models/group-approvals';

export interface GroupChanges {
  name?: string,
  description?: string|null,
  root_activity_id?: string|null,
  root_skill_id?: string|null,
  require_lock_membership_approval_until: GroupApprovals['requireLockMembershipApprovalUntil'],
  require_personal_info_access_approval: GroupApprovals['requirePersonalInfoAccessApproval'],
  approval_change_action?: 'empty'|'reinvite',
}

@Injectable({
  providedIn: 'root'
})
export class GroupUpdateService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  updateGroup(groupId: string, changes: GroupChanges) : Observable<void> {
    return this.http.put<SimpleActionResponse>(`${this.config.apiUrl}/groups/${groupId}`, changes).pipe(
      map(assertSuccess),
    );
  }
}
