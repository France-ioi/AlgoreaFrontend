import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData, objectToMap } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { Result } from '../helpers/response-toast';

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

  processLeaveRequest(groupId: string, memberIds: string[], action: Action): Observable<Map<string, any>> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return this.http
      .post<ActionResponse<Object>>(`${appConfig().apiUrl}/groups/${groupId}/leave-requests/${type}`, null, {
        params: {
          group_ids: memberIds.join(','),
        },
      })
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }

  processGroupInvitation(groupId: string, action: Action): Observable<Map<string, any>> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return this.http
      .post<ActionResponse<Object>>(`${appConfig().apiUrl}/current-user/group-invitations/${groupId}/${type}`, null)
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }
}

export function parseResults(data: Map<string, any>[]): Result {
  const res : Result = { countRequests: 0, countSuccess: 0 };
  data.forEach(elm => {
    res.countRequests += elm.size;
    res.countSuccess += Array.from(elm.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0);
  });
  return res;
}
