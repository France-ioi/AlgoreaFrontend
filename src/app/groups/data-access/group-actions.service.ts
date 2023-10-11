import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleActionResponse, assertSuccess } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';

@Injectable({
  providedIn: 'root'
})
export class GroupActionsService {

  constructor(private http: HttpClient) {}

  updateGroup(id: string, changes: object): Observable<void> {
    return this.http
      .put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${id}`, changes)
      .pipe(
        map(assertSuccess)
      );
  }

}
