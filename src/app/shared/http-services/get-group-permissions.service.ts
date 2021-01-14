import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';

interface Permissions<T> {
  granted_only_group: T,
  computed: T,
  granted_group_membership: T,
  granted_self: T,
  granted_other: T,
}

interface GroupPermissions {
  can_view: Permissions<'none'|'info'|'content'|'content_with_descendants'|'solution'>,
  can_grant_view: Permissions<'none'|'enter'|'content'|'content_with_descendants'|'solution'|'solution_with_grant'>,
  can_watch: Permissions<'none'|'result'|'answer'|'answer_with_grant'>,
  can_edit: Permissions<'none'|'children'|'all'|'all_with_grant'>,
  can_enter_from: {
    granted_only_group: string,
  },
  can_enter_until: {
    granted_only_group: string,
  },
  can_make_session_official: boolean,
  is_owner: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupPermissionsService {

  constructor(private http: HttpClient) { }

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissions> {
    return this.http
      .get<GroupPermissions>(`${appConfig().apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId})`);
  }
}
