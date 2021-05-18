import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData, objectToMap } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
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

  processJoinRequests(ids: Map<string, string[]>, action: Action): Observable<Map<string, any>[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      Array.from(ids.entries()).map(groupMembersIds =>
        this.http
          .post<ActionResponse<Object>>(`${appConfig.apiUrl}/groups/${groupMembersIds[0]}/join-requests/${type}`, null, {
            params: {
              group_ids: groupMembersIds[1].join(','),
            },
          })
          .pipe(
            map(successData),
            map(objectToMap)
          )
      )
    );
  }

  processLeaveRequests(ids: Map<string, string[]>, action: Action): Observable<Map<string, any>[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      Array.from(ids.entries()).map(groupMembersIds =>
        this.http
          .post<ActionResponse<Object>>(`${appConfig.apiUrl}/groups/${groupMembersIds[0]}/leave-requests/${type}`, null, {
            params: {
              group_ids: groupMembersIds[1].join(','),
            },
          })
          .pipe(
            map(successData),
            map(objectToMap)
          )
      )
    );
  }

  processGroupInvitations(groupIds: string[], action: Action): Observable<Map<string, any>[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      groupIds.map(groupId =>
        this.http
          .post<ActionResponse<Object>>(`${appConfig.apiUrl}/current-user/group-invitations/${groupId}/${type}`, null)
          .pipe(
            map(successData),
            map(objectToMap)
          )
      )
    );
  }
}

export function parseResults(data: Map<string, any>[]): { countRequests: number, countSuccess: number } {
  const res = { countRequests: 0, countSuccess: 0 };
  data.forEach(elm => {
    res.countRequests += elm.size;
    res.countSuccess += Array.from(elm.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0);
  });
  return res;
}
