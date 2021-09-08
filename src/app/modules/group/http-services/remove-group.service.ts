import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { catchError, map } from 'rxjs/operators';

export function parseResults(data: Map<string, SimpleActionResponse>): { countRequests: number, countSuccess: number } {
  return {
    countRequests: data.size,
    countSuccess: Array.from(data.values())
      .map<number>(state => (state.success ? 1 : 0))
      .reduce((acc, res) => acc + res, 0)
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

  removeBatch(ids: string[]): Observable<{ countRequests: number, countSuccess: number }> {
    return forkJoin(
      ids.map(id => this.remove(id).pipe(catchError(data => of(data))))
    ).pipe(
      map(data => parseResults(new Map(Object.entries(data)))),
    );
  }
}
