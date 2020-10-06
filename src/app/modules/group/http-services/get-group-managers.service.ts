import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Manager {
  id: string,
  name: string,

  can_manage: 'none' | 'memberships' | 'memberships_and_group',
  can_grant_group_access: boolean,
  can_watch_members: boolean,
}


@Injectable({
  providedIn: 'root'
})
export class GetGroupManagersService {

  constructor(private http: HttpClient) { }

  getGroupManagers(
    group_id: string,
    sort: string[] = [],
    ): Observable<Manager[]> {
    let params = new HttpParams();
    if (sort.length > 0) {
      params = params.set('sort', sort.join(','));
    }
    return this.http
      .get<Manager[]>(`${environment.apiUrl}/groups/${group_id}/managers`, { params: params });
  }
}
