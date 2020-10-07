import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PendingRequest {
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

@Injectable({
  providedIn: 'root'
})
export class GetRequestsService {

  constructor(private http: HttpClient) {}

  getPendingRequests(
    groupId: string | undefined,
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
      .get<PendingRequest[]>(`${environment.apiUrl}/groups/user-requests`, { params: params });
  }

}
