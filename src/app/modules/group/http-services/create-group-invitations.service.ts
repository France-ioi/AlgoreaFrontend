import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export enum InvitationResult {
  Success,
  Error,
  AlreadyInvited,
  NotFound,
}

@Injectable({
  providedIn: 'root'
})
export class CreateGroupInvitationsService {

  constructor(private http: HttpClient) {}

  createInvitations(
    groupId: string,
    logins : string[]
  ) : Observable<Map<string, InvitationResult>> {
    return this.http
      .post<ActionResponse<Object>>(
        `${appConfig.apiUrl}/groups/${groupId}/invitations`,
        { logins: logins }, {})
      .pipe(
        map(successData),
        map(function (data: Object): Map<string, InvitationResult> {
          return new Map<string, InvitationResult>(
            Object.entries(data).map(
              ([ key, value ]) => {
                switch (value) {
                  case 'success':
                    return [ key, InvitationResult.Success ];
                  case 'unchanged':
                    return [ key, InvitationResult.AlreadyInvited ];
                  case 'not_found':
                    return [ key, InvitationResult.NotFound ];
                  case 'cycle':
                  case 'invalid':
                    return [ key, InvitationResult.Error ];
                  default:
                    throw new Error(`Invitation of user ${key} returned an unexpected result (${JSON.stringify(value)})`);
                }
              }));
        })
      );
  }
}
