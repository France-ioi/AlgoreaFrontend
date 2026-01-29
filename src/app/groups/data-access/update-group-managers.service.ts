import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { SimpleActionResponse } from '../../data-access/action-response';
import { GroupManagershipLevel } from '../models/group-management';

export interface GroupManagerPermissionChanges {
  canManage?: GroupManagershipLevel,
  canGrantGroupAccess?: boolean,
  canWatchMembers?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class UpdateGroupManagersService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  update(
    groupId: string,
    managerId: string,
    payload: GroupManagerPermissionChanges
  ): Observable<SimpleActionResponse> {
    return this.http.put<SimpleActionResponse>(`${this.config.apiUrl}/groups/${groupId}/managers/${managerId}`, {
      can_manage: payload.canManage,
      can_grant_group_access: payload.canGrantGroupAccess,
      can_watch_members: payload.canWatchMembers,
    });
  }
}
