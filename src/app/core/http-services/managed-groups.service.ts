import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export type GroupType = 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'Session' | 'Base';
export type ManageType = 'none' | 'memberships' | 'memberships_and_group';

export interface Group {
  id: string,
  name: string,
  type: GroupType,
  canManage: ManageType,
  canWatchMember: boolean,
  canGrantGroupAccess: boolean
}

interface RawGroup {
  id: string,
  name: string,
  type: GroupType,
  can_manage: ManageType,
  can_watch_members: boolean,
  can_grant_group_access: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<RawGroup[]>(`${appConfig.apiUrl}/current-user/managed-groups`)
      .pipe(
        map(groups =>
          groups.map(g => ({
            id: g.id,
            name: g.name,
            type: g.type,
            canManage: g.can_manage,
            canWatchMember: g.can_watch_members,
            canGrantGroupAccess: g.can_grant_group_access,
          }))
        )
      );
  }

}


