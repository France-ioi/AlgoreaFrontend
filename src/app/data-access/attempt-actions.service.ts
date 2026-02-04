import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateResponse, createdId } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AttemptActionsService {
  private config = inject(APPCONFIG);
  private http = inject(HttpClient);

  create(itemIdPath: string[], parentAttemptId: string): Observable<string> {
    const path = itemIdPath.join('/');
    return this.http
      .post<CreateResponse>(`${this.config.apiUrl}/items/${path}/attempts`, null, {
        params: {
          parent_attempt_id: parentAttemptId
        }
      })
      .pipe(
        map(createdId)
      );
  }

}
