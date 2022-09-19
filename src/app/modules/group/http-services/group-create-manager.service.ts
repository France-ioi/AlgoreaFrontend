import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse } from '../../../shared/http-services/action-response';
import { appConfig } from '../../../shared/helpers/config';
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
  constructor(private http: HttpClient) {
  }

  create(
    groupId: string,
    managerId: string,
    payload: GroupManagerPermissionChanges = defaultPermissions,
  ): Observable<ActionResponse<unknown>> {
    return this.http.post<ActionResponse<unknown>>(`${appConfig.apiUrl}/groups/${groupId}/managers/${managerId}`, {
      can_manage: payload.canManage,
      can_grant_group_access: payload.canGrantGroupAccess,
      can_watch_members: payload.canWatchMembers,
    });
  }
}
