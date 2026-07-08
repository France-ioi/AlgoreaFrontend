import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { APPCONFIG } from 'src/app/config';

type Status = 'success'|'invalid'|'unchanged'|'cycle'|'approvals_missing'|'full';

@Injectable({
  providedIn: 'root'
})
export class WithdrawInvitationsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  withdraw(parentGroupId: string, userGroupIds: string[]): Observable<Map<string, Status>> {
    return this.http
      .post<ActionResponse<{[user: string]: Status}>>(
        `${this.config.apiUrl}/groups/${parentGroupId}/invitations/withdraw`, null, {
          params: {
            group_ids: userGroupIds.join(','),
          },
        })
      .pipe(
        map(successData),
        map(data => new Map(Object.entries(data)))
      );
  }
}
