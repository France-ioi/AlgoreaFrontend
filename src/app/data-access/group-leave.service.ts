import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { ActionResponse, successData } from 'src/app/data-access/action-response';

interface LeaveGroupResponseData {
  changed: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GroupLeaveService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  leave(groupId: string): Observable<boolean> {
    return this.http.delete<ActionResponse<LeaveGroupResponseData>>(`${this.config.apiUrl}/current-user/group-memberships/${groupId}`)
      .pipe(
        map(successData),
        map((data: LeaveGroupResponseData) => data.changed)
      );
  }

}
