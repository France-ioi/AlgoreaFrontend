import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse } from '../../data-access/action-response';
import { APPCONFIG } from '../../config';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupManagerPermissionChanges } from './update-group-managers.service';

const defaultPermissions: GroupManagerPermissionChanges = {
  canGrantGroupAccess: false,
  canManage: 'none',
  canWatchMembers: false,
};

@Injectable({
  providedIn: 'root',
})
export class GroupCreateManagerService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  create(
    groupId: string,
    managerId: string,
    payload: GroupManagerPermissionChanges = defaultPermissions,
  ): Observable<ActionResponse<unknown>> {
    return this.http.post<ActionResponse<unknown>>(`${this.config.apiUrl}/groups/${groupId}/managers/${managerId}`, {
      can_manage: payload.canManage,
      can_grant_group_access: payload.canGrantGroupAccess,
      can_watch_members: payload.canWatchMembers,
    });
  }
}
