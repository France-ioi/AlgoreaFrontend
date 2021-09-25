import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { catchError, map } from 'rxjs/operators';
import { Result } from '../components/member-list/group-removal-response-handling';

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
  constructor(private http: HttpClient) {
  }

  remove(id: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${id}`);
  }

  removeBatch(ids: string[]): Observable<Result> {
    return forkJoin(
      ids.map(id => this.remove(id).pipe(catchError(({ error }) => of(error))))
    ).pipe(
      map(parseResults),
    );
  }
}
