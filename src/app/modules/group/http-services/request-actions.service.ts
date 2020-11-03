import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData, objectToMap } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';

@Injectable({
  providedIn: 'root'
})
export class RequestActionsService {

  constructor(private http: HttpClient) {}

  acceptJoinRequest(groupId: string, memberIds: string[]): Observable<Map<string, any>> {
    return this.http
      .post<ActionResponse<Object>>(`${appConfig().apiUrl}/groups/${groupId}/join-requests/accept`, null, {
        params: {
          group_ids: memberIds.join(','),
        },
      })
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }

  rejectJoinRequest(groupId: string, memberIds: string[]): Observable<Map<string, any>> {
    return this.http
      .post<ActionResponse<Object>>(`${appConfig().apiUrl}/groups/${groupId}/join-requests/reject`, null, {
        params: {
          group_ids: memberIds.join(','),
        }
      })
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }

}
