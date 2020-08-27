import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SimpleActionResponse, assertSuccess } from './action-response';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResultActionsService {

  constructor(private http: HttpClient) {}

  start(itemIdPath: string[], attemptId: string): Observable<void> {
    const path = itemIdPath.join('/');
    return this.http
      .post<SimpleActionResponse>(`${environment.apiUrl}/items/${path}/start-result`, null, {
        params: {
          attempt_id: attemptId
        }
      })
      .pipe(
        map(assertSuccess)
      );
  }


}
