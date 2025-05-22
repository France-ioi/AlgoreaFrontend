import { HttpClient, HttpParams } from '@angular/common/http';
import { ActionResponse, successData } from '../../data-access/action-response';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProcessGroupInvitationService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  accept(groupId: string, approvals: string[] = []): Observable<{ changed: boolean }> {
    const url = `${this.config.apiUrl}/current-user/group-invitations/${groupId}/accept`;
    return this.sendAction(url, approvals);
  }

  reject(groupId: string, approvals: string[] = []): Observable<{ changed: boolean }> {
    const url = `${this.config.apiUrl}/current-user/group-invitations/${groupId}/reject`;
    return this.sendAction(url, approvals);
  }

  private sendAction(url: string, approvals: string[] = []): Observable<{ changed: boolean }> {
    const params = new HttpParams().set('approvals', approvals.join(','));
    return this.http
      .post<ActionResponse<{ changed: boolean }>>(url, null, { params })
      .pipe(map(successData));
  }
}
