import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { ActionResponse, assertSuccess, SimpleActionResponse, successData } from 'src/app/data-access/action-response';

interface NewGroupData {
  id: string,
}

@Injectable({
  providedIn: 'root'
})
export class GroupCreationService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  create(name: string, type: 'Class'|'Team'|'Club'|'Friends'|'Other'|'Session'): Observable<string> {
    const body = {
      name: name,
      type: type
    };
    return this.http
      .post<ActionResponse<NewGroupData>>(`${this.config.apiUrl}/groups`, body, {})
      .pipe(
        map(successData),
        map(response => response.id),
      );
  }

  addSubgroup(parentId: string, childId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${this.config.apiUrl}/groups/${parentId}/relations/${childId}`, null, {})
      .pipe(map(assertSuccess));
  }
}
