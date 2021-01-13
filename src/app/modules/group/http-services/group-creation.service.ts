import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/shared/http-services/action-response';

interface GroupCreateResponse {
  data: {
    id: string,
  },
  success: true,
  message: 'created',
}

@Injectable({
  providedIn: 'root'
})
export class GroupCreationService {

  constructor(private http: HttpClient) { }

  create(name: string, type: 'Class'|'Team'|'Club'|'Friends'|'Other'|'Session'): Observable<GroupCreateResponse> {
    const params = new HttpParams().set('name', name).set('type', type);
    return this.http
      .post<GroupCreateResponse>(`${appConfig().apiUrl}/groups`, null, { params: params });
  }

  addSubgroup(parentId: string, childId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig().apiUrl}/groups/${parentId}/relations/${childId}`, null, {})
      .pipe(map(assertSuccess));
  }
}
