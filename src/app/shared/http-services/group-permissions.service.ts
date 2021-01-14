import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';

export interface Permissions {
  can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  can_grant_view: 'none'|'enter'|'content'|'content_with_descendants'|'solution'|'solution_with_grant',
  can_watch: 'none'|'result'|'answer'|'answer_with_grant',
  can_edit: 'none'|'children'|'all'|'all_with_grant',
  can_make_session_official: boolean,
  is_owner: boolean,
}

interface GroupPermissions {
  granted: Permissions,
  computed: Permissions,
  granted_via_group_membership: Permissions,
  granted_via_item_unlocking: Permissions,
  granted_via_self: Permissions,
  granted_via_other: Permissions,
}

@Injectable({
  providedIn: 'root'
})
export class GroupPermissionsService {

  constructor(private http: HttpClient) { }

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissions> {
    return this.http
      .get<GroupPermissions>(`${appConfig().apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`);
  }
}
