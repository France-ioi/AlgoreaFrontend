import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';

@Injectable({
  providedIn: 'root'
})
export class UpdateGroupManagersService {

  constructor(private http: HttpClient) { }

  update(
    groupId: string,
    managerId: string,
    payload: { canManage: string, canGrantGroupAccess: boolean, canWatchMembers: boolean }
  ): Observable<SimpleActionResponse> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}/managers/${managerId}`, {
      can_manage: payload.canManage,
      can_grant_group_access: payload.canGrantGroupAccess,
      can_watch_members: payload.canWatchMembers,
    });
  }
}
