import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { map } from 'rxjs/operators';

interface RawMember {
  id: string,
  member_since: string|null;
  action: 'invitation_accepted'|'join_request_accepted'|'joined_by_code'|'added_directly';
  user: null|{
    login: string,
    first_name: string|null,
    last_name: string|null,
    grade: number|null,
    group_id: string,
  },
}

export interface Member {
  id: string,
  memberSince: Date|null;
  action: 'invitation_accepted'|'join_request_accepted'|'joined_by_code'|'added_directly';
  user: null|{
    login: string,
    firstName: string|null,
    lastName: string|null,
    grade: number|null,
    groupId: string,
  },
}


@Injectable({
  providedIn: 'root'
})
export class GetGroupMembersService {

  constructor(private http: HttpClient) { }

  getGroupMembers(
    groupId: string,
    sort: string[] = []
  ): Observable<Member[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawMember[]>(`${appConfig().apiUrl}/groups/${groupId}/members`, { params: params })
      .pipe(
        map(rawMembers => rawMembers.filter(m => m.user).map(m => ({
          id: m.id,
          memberSince: m.member_since === null ? null : new Date(m.member_since),
          action: m.action,
          user: m.user === null ? null :{
            login: m.user.login,
            firstName: m.user.first_name,
            lastName: m.user.last_name,
            grade: m.user.grade,
            groupId: m.user.group_id,
          },
        })))
      );
  }
}
