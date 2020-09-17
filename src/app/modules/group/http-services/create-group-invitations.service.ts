import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';

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
  ) : Observable<Map<string, InvitationResult>>
  {
    return this.http
      .post<ActionResponse<Object>>(
        `${environment.apiUrl}/groups/${groupId}/invitations`,
        {logins: logins}, {})
      .pipe(
        map(successData),
        map(function (data: Object): Map<string, InvitationResult> {
          return new Map<string, InvitationResult>(
            Object.entries(data).map(
              ([key, value]) => {
                const result = InvitationResult[value as keyof typeof InvitationResult];
                if (result == undefined)
                  throw new Error(`Invitation of user ${key} returned an unexpected result`);
                return [key, value];
          }));
        })
      );
  }
}
