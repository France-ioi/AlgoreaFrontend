import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { map } from 'rxjs/operators';

interface RawPendingRequest {
  at: string|null;
  group: {
    id: string;
    name: string;
  };
  user: {
    group_id: string;
    login: string;
    first_name: string|null;
    last_name: string|null;
    grade: number|null;
  }
}

export interface PendingRequest {
  at: Date|null;
  group: {
    id: string;
    name: string;
  };
  user: {
    groupId: string;
    login: string;
    firstName: string|null;
    lastName: string|null;
    grade: number|null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GetRequestsService {

  constructor(private http: HttpClient) {}

  getPendingRequests(
    groupId: string,
    includeSubgroup : boolean = false,
    sort: string[] = []
  ): Observable<PendingRequest[]> {
    let params = new HttpParams();
    if (groupId) {
      params = params.set('group_id', groupId);
      if (includeSubgroup) params = params.set('include_descendant_groups', '1');
    }
    if (sort.length > 0) {
      params = params.set('sort', sort.join(','));
    }
    return this.http
      .get<RawPendingRequest[]>(`${appConfig().apiUrl}/groups/user-requests`, { params: params })
      .pipe(
        map(pendingRequests => pendingRequests.map(r => ({
          at: r.at === null ? null : new Date(r.at),
          group: r.group,
          user: {
            groupId: r.user.group_id,
            login: r.user.login,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            grade: r.user.grade,
          }
        })))
      );
  }

}
