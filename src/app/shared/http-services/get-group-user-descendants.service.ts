import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

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
    grade: number,
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
    grade: number,
  },
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupUserDescendantsService {

  constructor(private http: HttpClient) { }

  getGroupUserDescendants(
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
}
