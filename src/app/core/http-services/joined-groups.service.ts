import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

export interface Group {
  id: string,
  name: string
}

interface JoinedGroup{
  action: string;
  group: {
    description?: string
    id: string
    name: string
    type: string
  };
  member_since: string
}

@Injectable({
  providedIn: 'root'
})
export class JoinedGroupsService {

  constructor(private http: HttpClient) {}

  getJoinedGroups(): Observable<Group[]> {
    return this.http
      .get<JoinedGroup[]>(`${environment.apiUrl}/current-user/group-memberships`)
      .pipe(
        // convert array of JoinedGroup to array of Group
        map(jgs =>
          jgs.map(jg => ({ id: jg.group.id, name: jg.group.name }))
        )
      );
  }

}


