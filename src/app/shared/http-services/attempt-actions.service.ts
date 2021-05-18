import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateResponse, createdId } from './action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';

@Injectable({
  providedIn: 'root'
})
export class AttemptActionsService {

  constructor(private http: HttpClient) {}

  create(itemIdPath: string[], parentAttemptId: string): Observable<string> {
    const path = itemIdPath.join('/');
    return this.http
      .post<CreateResponse>(`${appConfig.apiUrl}/items/${path}/attempts`, null, {
        params: {
          parent_attempt_id: parentAttemptId
        }
      })
      .pipe(
        map(createdId)
      );
  }

}
