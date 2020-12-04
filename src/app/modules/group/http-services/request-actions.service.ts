import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData, objectToMap } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';

export enum Action {
  Accept,
  Reject,
}

@Injectable({
  providedIn: 'root'
})
export class RequestActionsService {

  constructor(private http: HttpClient) {}

  processJoinRequest(groupId: string, memberIds: string[], action: Action): Observable<Map<string, any>> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return this.http
      .post<ActionResponse<Object>>(`${appConfig().apiUrl}/groups/${groupId}/join-requests/${type}`, null, {
        params: {
          group_ids: memberIds.join(','),
        },
      })
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }
}
