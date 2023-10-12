import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';

type Status = 'invalid'|'success'|'unchanged'|'not_found';

export enum Action {
  Accept,
  Reject,
}

@Injectable({
  providedIn: 'root'
})
export class RequestActionsService {

  constructor(private http: HttpClient) {}

  processJoinRequests(ids: Map<string, string[]>, action: Action): Observable<Map<string, Status>[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      Array.from(ids.entries()).map(groupMembersIds =>
        this.http
          .post<ActionResponse<{[user: string]: Status}>>(
            `${appConfig.apiUrl}/groups/${groupMembersIds[0]}/join-requests/${type}`, null, {
              params: {
                group_ids: groupMembersIds[1].join(','),
              },
            })
          .pipe(
            map(successData),
            map(data => new Map(Object.entries(data)))
          )
      )
    );
  }

  processLeaveRequests(ids: Map<string, string[]>, action: Action): Observable<Map<string, Status>[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      Array.from(ids.entries()).map(groupMembersIds =>
        this.http
          .post<ActionResponse<{[user: string]: Status}>>(
            `${appConfig.apiUrl}/groups/${groupMembersIds[0]}/leave-requests/${type}`, null, {
              params: {
                group_ids: groupMembersIds[1].join(','),
              },
            })
          .pipe(
            map(successData),
            map(data => new Map(Object.entries(data)))
          )
      )
    );
  }

  processGroupInvitations(groupIds: string[], action: Action): Observable<{ changed: boolean }[]> {
    const type = action === Action.Accept ? 'accept' : 'reject';
    return forkJoin(
      groupIds.map(groupId =>
        this.http
          .post<ActionResponse<{ changed: boolean }>>(`${appConfig.apiUrl}/current-user/group-invitations/${groupId}/${type}`, null)
          .pipe(
            map(successData),
          )
      )
    );
  }
}

export function parseResults(data: Map<string, Status>[]): { countRequests: number, countSuccess: number } {
  const res = { countRequests: 0, countSuccess: 0 };
  data.forEach(elm => {
    res.countRequests += elm.size;
    res.countSuccess += Array.from(elm.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0);
  });
  return res;
}

export function parseGroupInvitationResults(data: { changed: boolean }[]): { countRequests: number, countSuccess: number } {
  return {
    countRequests: data.length,
    countSuccess: data.filter(state => state.changed).length,
  };
}
