import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';

export enum InvitationResult {
  Success,
  Error,
  AlreadyInvited,
  AlreadyMember,
  NotFound,
}

@Injectable({
  providedIn: 'root'
})
export class CreateGroupInvitationsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  createInvitations(
    groupId: string,
    logins : string[]
  ) : Observable<Map<string, InvitationResult>> {
    return this.http
      .post<ActionResponse<object>>(
        `${this.config.apiUrl}/groups/${groupId}/invitations`,
        { logins: logins }, {})
      .pipe(
        map(successData),
        map(function (data: object): Map<string, InvitationResult> {
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
                    return [ key, InvitationResult.Error ];
                  // API `invalid`: user is already a member of this group
                  case 'invalid':
                    return [ key, InvitationResult.AlreadyMember ];
                  default:
                    throw new Error(`Invitation of user ${key} returned an unexpected result (${JSON.stringify(value)})`);
                }
              }));
        })
      );
  }
}
