import { Injectable } from '@angular/core';
import { concat, Observable, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { SimpleActionResponse } from '../../../shared/http-services/action-response';
import { Result } from '../components/member-list/group-removal-response-handling';
import { catchError, map, reduce } from 'rxjs/operators';
import { parseResults } from './remove-group.service';

@Injectable({
  providedIn: 'root',
})
export class RemoveGroupManagerService {
  constructor(private http: HttpClient) {
  }

  remove(groupId: string, managerId: string): Observable<SimpleActionResponse> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${groupId}/managers/${managerId}`);
  }

  removeBatch(parentGroupId: string, ids: string[]): Observable<Result> {
    return forkJoin([
      concat(...ids.map(id => this.remove(parentGroupId, id))).pipe(
        catchError(() => of({ success: false, message: $localize`Failed to delete manager` })),
        reduce<SimpleActionResponse, SimpleActionResponse[]>((removedManagers, removedManager) =>
          [ ...removedManagers, removedManager ], []
        ),
      ),
    ]).pipe(
      map(([ removedManagers ]) => parseResults(removedManagers)),
    );
  }
}
