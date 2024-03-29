import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../../utils/config';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { assertSuccess, SimpleActionResponse } from '../../data-access/action-response';

@Injectable()
export class GroupDeleteService {

  constructor(private http: HttpClient) {
  }

  delete(groupId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}`).pipe(
      map(assertSuccess),
    );
  }

}
