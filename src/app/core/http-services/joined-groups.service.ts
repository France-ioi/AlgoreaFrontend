import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

interface RawJoinedGroup{
  action: 'invitation_accepted' | 'join_request_accepted' | 'joined_by_code' | 'added_directly',
  group: {
    description?: string,
    id: string,
    name: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'Base',
  },
  member_since: string,
}

export interface JoinedGroup{
  action: 'invitation_accepted' | 'join_request_accepted' | 'joined_by_code' | 'added_directly',
  group: {
    description?: string,
    id: string,
    name: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'Base',
  },
  memberSince: Date,
}

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {

  constructor(private http: HttpClient) {}

  getJoinedGroups(
    sort: string[] = [],
  ): Observable<JoinedGroup[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawJoinedGroup[]>(`${appConfig().apiUrl}/current-user/group-memberships`, { params: params })
      .pipe(
        map(groups => groups.map(g => ({
          action: g.action,
          group: g.group,
          memberSince: new Date(g.member_since),
        })))
      );
  }

}


