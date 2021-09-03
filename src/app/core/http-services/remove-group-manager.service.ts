import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../shared/helpers/config';
import { SimpleActionResponse } from '../../shared/http-services/action-response';

@Injectable({
  providedIn: 'root',
})
export class RemoveGroupManagerService {
  constructor(private http: HttpClient) {
  }

  remove(groupId: string, managerId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}/managers/${managerId}`);
  }
}
