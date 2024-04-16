import { HttpClient, HttpParams } from '@angular/common/http';
import { ActionResponse, successData } from '../../data-access/action-response';
import { appConfig } from '../../utils/config';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProcessGroupInvitationService {
  constructor(private http: HttpClient) {}

  accept(groupId: string, approvals: string[] = []): Observable<{ changed: boolean }> {
    const params = new HttpParams().set('approvals', approvals.join(','));
    return this.http
      .post<ActionResponse<{ changed: boolean }>>(`${appConfig.apiUrl}/current-user/group-invitations/${groupId}/accept`, null, { params })
      .pipe(map(successData));
  }

  reject(groupId: string, approvals: string[] = []): Observable<{ changed: boolean }> {
    const params = new HttpParams().set('approvals', approvals.join(','));
    return this.http
      .post<ActionResponse<{ changed: boolean }>>(`${appConfig.apiUrl}/current-user/group-invitations/${groupId}/reject`, null, { params })
      .pipe(map(successData));
  }
}
