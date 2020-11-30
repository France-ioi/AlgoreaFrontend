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



@Injectable({
  providedIn: 'root'
})
export class GetGroupTeamDescendantsService {

  constructor(private http: HttpClient) { }

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
