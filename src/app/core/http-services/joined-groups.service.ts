import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { SortOptions, sortOptionsToHTTP } from 'src/app/shared/helpers/sort-options';

interface RawJoinedGroup {
  action: 'invitation_accepted' | 'join_request_accepted' | 'joined_by_code' | 'added_directly',
  group: {
    description: string|null,
    id: string,
    name: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'Base',
  },
  member_since: string|null,
}

export interface JoinedGroup {
  action: 'invitation_accepted' | 'join_request_accepted' | 'joined_by_code' | 'added_directly',
  group: {
    description: string|null,
    id: string,
    name: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'Base',
  },
  memberSince: Date|null,
}

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {

  constructor(private http: HttpClient) {}

  getJoinedGroups(sort: SortOptions): Observable<JoinedGroup[]> {
    return this.http
      .get<RawJoinedGroup[]>(`${appConfig().apiUrl}/current-user/group-memberships`, { params: sortOptionsToHTTP(sort) })
      .pipe(
        map(groups => groups.map(g => ({
          action: g.action,
          group: g.group,
          memberSince: g.member_since === null ? null : new Date(g.member_since),
        })))
      );
  }

}
