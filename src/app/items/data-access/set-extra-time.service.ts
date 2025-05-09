import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SetExtraTimeService {

  constructor(private http: HttpClient) {}

  set(itemId: string, groupId: string, seconds: number): Observable<void> {
    return this.http
      .put<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}/groups/${groupId}/additional-times`, undefined, {
        params: new HttpParams().append('seconds', seconds),
      }).pipe(
        map(assertSuccess),
      );
  }

}
