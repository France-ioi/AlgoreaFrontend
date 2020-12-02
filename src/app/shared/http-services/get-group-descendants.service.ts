import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

interface RawTeamDescendants {
  id: string,
  name: string,
  grade: number,
  members: {
    login: string,
    group_id: string,
    first_name: string|null,
    last_name: string|null,
    grade: number|null;
  }[],
  parents: {
    id: string,
    name: string,
  }[],
}

export interface TeamDescendants {
  id: string,
  name: string,
  grade: number,
  members: {
    login: string,
    groupId: string,
    firstName: string|null,
    lastName: string|null,
    grade: number|null;
  }[],
  parents: {
    id: string,
    name: string,
  }[],
}

interface RawUserDescendant {
  id: string,
  name: string,
  parents: {
    id: string,
    name: string,
  }[],
  user: {
    login: string,
    first_name: string|null,
    last_name: string|null,
    grade: number|null,
  },
}

export interface UserDescendant {
  id: string,
  name: string,
  parents: {
    id: string,
    name: string,
  }[],
  user: {
    login: string,
    firstName: string|null,
    lastName: string|null,
    grade: number|null,
  },
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupDescendantsService {

  constructor(private http: HttpClient) { }

  getUserDescendants(
    groupId: string,
    sort: string[] = [],
  ): Observable<UserDescendant[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawUserDescendant[]>(`${appConfig().apiUrl}/groups/${groupId}/user-descendants`, { params: params })
      .pipe(
        map(rawUserDescendants => rawUserDescendants.map(m => ({
          id: m.id,
          name: m.name,
          parents: m.parents,
          user: {
            login: m.user.login,
            firstName: m.user.first_name,
            lastName: m.user.last_name,
            grade: m.user.grade,
          },
        })))
      );
  }

  getTeamDescendants(
    groupId: string,
    sort: string[] = [],
  ): Observable<TeamDescendants[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawTeamDescendants[]>(`${appConfig().apiUrl}/groups/${groupId}/team-descendants`, { params: params })
      .pipe(
        map(rawTeamDescendants => rawTeamDescendants.map(t => ({
          id: t.id,
          name: t.name,
          grade: t.grade,
          members: t.members.map(m => ({
            login: m.login,
            groupId: m.group_id,
            firstName: m.first_name,
            lastName: m.last_name,
            grade: m.grade,
          })),
          parents: t.parents,
        })))
      );
  }
}
