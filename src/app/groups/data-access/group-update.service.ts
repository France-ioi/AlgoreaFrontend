import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { GroupApprovals } from './get-group-by-id.service';

export interface GroupChanges {
  name?: string,
  description?: string|null,
  root_activity_id?: string|null,
  root_skill_id?: string|null,
  require_lock_membership_approval_until: GroupApprovals['requireLockMembershipApprovalUntil'],
  require_personal_info_access_approval: GroupApprovals['requirePersonalInfoAccessApproval'],
}

@Injectable({
  providedIn: 'root'
})
export class GroupUpdateService {

  constructor(private http: HttpClient) {
  }

  updateGroup(groupId: string, changes: GroupChanges) : Observable<void> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}`, changes).pipe(
      map(assertSuccess),
    );
  }
}
