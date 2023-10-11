import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { ActionResponse, assertSuccess, SimpleActionResponse, successData } from 'src/app/data-access/action-response';

interface NewGroupData {
  id: string,
}

@Injectable({
  providedIn: 'root'
})
export class GroupCreationService {

  constructor(private http: HttpClient) { }

  create(name: string, type: 'Class'|'Team'|'Club'|'Friends'|'Other'|'Session'): Observable<string> {
    const body = {
      name: name,
      type: type
    };
    return this.http
      .post<ActionResponse<NewGroupData>>(`${appConfig.apiUrl}/groups`, body, {})
      .pipe(
        map(successData),
        map(response => response.id),
      );
  }

  addSubgroup(parentId: string, childId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${parentId}/relations/${childId}`, null, {})
      .pipe(map(assertSuccess));
  }
}
