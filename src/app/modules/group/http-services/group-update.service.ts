import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/shared/http-services/action-response';

export interface GroupChanges {
  name?: string,
  description?: string|null,
  root_activity_id?: string|null,
}

@Injectable({
  providedIn: 'root'
})
export class GroupUpdateService {

  constructor(private http: HttpClient) {
  }

  updateGroup(groupId: string, changes: GroupChanges) : Observable<void> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}`, changes).pipe(
      map(assertSuccess),
    );
  }
}
