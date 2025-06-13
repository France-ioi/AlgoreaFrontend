import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../../config';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { assertSuccess, SimpleActionResponse } from '../../data-access/action-response';

@Injectable()
export class GroupDeleteService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  delete(groupId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/groups/${groupId}`).pipe(
      map(assertSuccess),
    );
  }

}
