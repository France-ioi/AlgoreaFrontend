import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericActionResponse, throwErrorOnFailure } from 'src/app/shared/http-services/action-response';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestActionsService {

  constructor(private http: HttpClient) {}

  acceptJoinRequest(groupId: string, memberIds: string[]): Observable<GenericActionResponse> {
    return this.http
      .post<GenericActionResponse>(`${environment.apiUrl}/groups/${groupId}/join-requests/accept`, null, {
        params: {
          group_ids: memberIds.join(','),
        },
      })
      .pipe(
        tap(throwErrorOnFailure)
      );
  }

  rejectJoinRequest(groupId: string, memberIds: string[]): Observable<GenericActionResponse> {
    return this.http
      .post<GenericActionResponse>(`${environment.apiUrl}/groups/${groupId}/join-requests/reject`, null, {
        params: {
          group_ids: memberIds.join(','),
        }
      })
      .pipe(
        tap(throwErrorOnFailure)
      );
  }

}
