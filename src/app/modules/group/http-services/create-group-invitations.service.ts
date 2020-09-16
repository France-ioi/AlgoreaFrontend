import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, successData, objectToMap } from 'src/app/shared/http-services/action-response';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class CreateGroupInvitationsService {

  constructor(private http: HttpClient) {}

  createInvitations(
    groupId: string,
    logins : string[]
  ) : Observable<Map<string, any>>
  {
    return this.http
      .post<ActionResponse<Object>>(
        `${environment.apiUrl}/groups/${groupId}/invitations`,
        {logins: logins}, {})
      .pipe(
        map(successData),
        map(objectToMap)
      );
  }
}
