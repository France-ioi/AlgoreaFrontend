import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';

type Status = 'invalid'|'success'|'unchanged'|'not_found';

@Injectable({
  providedIn: 'root'
})
export class GroupUsersService {

  constructor(private http: HttpClient) {}

  removeUsers(groupId: string, usersId: string[]): Observable<Map<string, Status>> {
    const httpParams = new HttpParams().set('user_ids', usersId.join(','));
    return this.http.delete<ActionResponse<{[user: string]: Status}>>(`${appConfig.apiUrl}/groups/${groupId}/members`, {
      params: httpParams
    }).pipe(
      map(successData),
      map(data => new Map(Object.entries(data)))
    );
  }
}

export function parseResults(data: Map<string, Status>): { countRequests: number, countSuccess: number } {
  const res = {
    countRequests: data.size,
    countSuccess: Array.from(data.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0) };
  return res;
}
