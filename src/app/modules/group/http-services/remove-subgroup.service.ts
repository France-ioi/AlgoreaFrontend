import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { catchError, map } from 'rxjs/operators';
import { parseResults } from './remove-group.service';
import { Result } from '../components/member-list/group-removal-response-handling';

@Injectable({
  providedIn: 'root',
})
export class RemoveSubgroupService {
  constructor(private http: HttpClient) {
  }

  remove(parentGroupId: string, childGroupId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${parentGroupId}/relations/${childGroupId}`);
  }

  removeBatch(parentGroupId: string, ids: string[]): Observable<Result> {
    return forkJoin(
      ids.map(id => this.remove(parentGroupId, id).pipe(catchError(({ error }) => of(error))))
    ).pipe(
      map(parseResults)
    );
  }
}
