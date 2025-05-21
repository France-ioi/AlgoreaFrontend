import { Injectable } from '@angular/core';
import { merge, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { assertSuccess, SimpleActionResponse } from '../../data-access/action-response';
import { reduce, map, switchMap, catchError } from 'rxjs/operators';

export interface Result {
  countRequests: number,
  countSuccess: number,
  errorText?: string,
}

export function parseResults(data: boolean[]): Result {
  return {
    countRequests: data.length,
    countSuccess: data.filter(success => success).length,
  };
}

@Injectable({
  providedIn: 'root',
})
export class RemoveGroupManagerService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  remove(groupId: string, managerId: string): Observable<void> {
    return this.http
      .delete<SimpleActionResponse>(`${this.config.apiUrl}/groups/${groupId}/managers/${managerId}`)
      .pipe(
        map(assertSuccess),
      );
  }

  removeBatch(parentGroupId: string, ids: string[], ownManagerId?: string): Observable<Result> {
    return merge(
      ...ids.map(id => this.remove(parentGroupId, id).pipe(
        map(() => true),
        catchError(() => of(false))),
      ),
    ).pipe(
      reduce<boolean, boolean[]>((removedManagers, success) =>
        [ ...removedManagers, success ], []
      ),
      switchMap(removedManagers =>
        (ownManagerId ?
          removedManagers.some(removedManager => !removedManager) ?
            of([ ...removedManagers, false ]) : this.remove(parentGroupId, ownManagerId).pipe(
              map(() => true),
              catchError(() => of(false)),
              map(success => [ ...removedManagers, success ]),
            )
          : of(removedManagers))
      ),
    ).pipe(
      map(parseResults),
    );
  }
}
