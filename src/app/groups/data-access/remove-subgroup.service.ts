import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { SimpleActionResponse } from '../../data-access/action-response';
import { catchError, map } from 'rxjs/operators';
import { parseResults } from './remove-group.service';
import { Result } from '../containers/member-list/group-removal-response-handling';

@Injectable({
  providedIn: 'root',
})
export class RemoveSubgroupService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  remove(parentGroupId: string, childGroupId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/groups/${parentGroupId}/relations/${childGroupId}`);
  }

  removeBatch(parentGroupId: string, ids: string[]): Observable<Result> {
    return forkJoin(
      ids.map(id => this.remove(parentGroupId, id).pipe(catchError(({ error }) => of(error))))
    ).pipe(
      map(parseResults)
    );
  }
}
