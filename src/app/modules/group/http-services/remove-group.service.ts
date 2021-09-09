import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { catchError, map } from 'rxjs/operators';

export function parseResults(data: Map<string, SimpleActionResponse>): { countRequests: number, countSuccess: number, errorText?: string } {
  const values = Array.from(data.values());

  return {
    countRequests: data.size,
    countSuccess: values.map<number>(state => (state.success ? 1 : 0)).reduce((acc, res) => acc + res, 0),
    errorText: values.some(value => !!value.error_text) ? $localize`The group(s) must be empty` : undefined,
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

  removeBatch(ids: string[]): Observable<{ countRequests: number, countSuccess: number, additionalMessage?: string }> {
    return forkJoin(
      ids.map(id => this.remove(id).pipe(catchError(({ error }) => of(error))))
    ).pipe(
      map(data => parseResults(new Map(Object.entries(data)))),
    );
  }
}
