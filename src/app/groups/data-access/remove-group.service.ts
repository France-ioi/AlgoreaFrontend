import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from '../../config';
import { inject } from '@angular/core';
import { SimpleActionResponse } from '../../data-access/action-response';
import { catchError, map } from 'rxjs/operators';
import { Result } from '../containers/member-list/group-removal-response-handling';

export function parseResults(data: SimpleActionResponse[]): Result {
  return {
    countRequests: data.length,
    countSuccess: data.filter(state => state.success).length,
    errorText: data.some(state => !!state.error_text) ? $localize`The group(s) must be empty` : undefined,
  };
}

@Injectable({
  providedIn: 'root',
})
export class RemoveGroupService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  remove(id: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/groups/${id}`);
  }

  removeBatch(ids: string[]): Observable<Result> {
    return forkJoin(
      ids.map(id => this.remove(id).pipe(catchError(({ error }) => of(error))))
    ).pipe(
      map(parseResults),
    );
  }
}
