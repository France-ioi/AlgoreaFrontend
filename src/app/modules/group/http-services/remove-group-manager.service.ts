import { Injectable } from '@angular/core';
import { merge, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { reduce, map, switchMap, catchError } from 'rxjs/operators';
import { Result } from '../components/member-list/group-removal-response-handling';

export function parseResults(data: SimpleActionResponse[]): Result {
  return {
    countRequests: data.length,
    countSuccess: data.filter(state => state.success).length,
  };
}

const failedState = { success: false, message: $localize`Failed to delete manager` };

@Injectable({
  providedIn: 'root',
})
export class RemoveGroupManagerService {
  constructor(private http: HttpClient) {
  }

  remove(groupId: string, managerId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}/managers/${managerId}`);
  }

  removeBatch(parentGroupId: string, ids: string[], ownManagerId?: string): Observable<Result> {
    return merge(
      ...ids.map(id => this.remove(parentGroupId, id).pipe(catchError(() => of(failedState)))),
    ).pipe(
      reduce<SimpleActionResponse, SimpleActionResponse[]>((removedManagers, removedManager) =>
        [ ...removedManagers, removedManager ], []
      ),
      switchMap(removedManagers =>
        (ownManagerId ?
          removedManagers.some(removedManager => !removedManager.success) ?
            of([ ...removedManagers, failedState ]) : this.remove(parentGroupId, ownManagerId).pipe(
              catchError(() => of(failedState)),
              map(removedManager => [ ...removedManagers, removedManager ]),
            )
          : of(removedManagers))
      ),
    ).pipe(
      map(parseResults),
    );
  }
}
