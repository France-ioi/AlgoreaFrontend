import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleActionResponse, assertSuccess } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GroupActionsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  updateGroup(id: string, changes: object): Observable<void> {
    return this.http
      .put<SimpleActionResponse>(`${this.config.apiUrl}/groups/${id}`, changes)
      .pipe(
        map(assertSuccess)
      );
  }

}
