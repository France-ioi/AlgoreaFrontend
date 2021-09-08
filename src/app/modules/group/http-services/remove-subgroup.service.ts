import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { catchError, map } from 'rxjs/operators';
import { parseResults } from './remove-group.service';

@Injectable({
  providedIn: 'root',
})
export class RemoveSubgroupService {
  constructor(private http: HttpClient) {
  }

  remove(parentGroupId: string, childGroupId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${parentGroupId}/relations/${childGroupId}`);
  }

  removeBatch(parentGroupId: string, ids: string[]): Observable<{ countRequests: number, countSuccess: number }> {
    return forkJoin(
      ids.map(id => this.remove(parentGroupId, id).pipe(catchError(data => of(data))))
    ).pipe(
      map(data => parseResults(new Map(Object.entries(data))))
    );
  }
}
