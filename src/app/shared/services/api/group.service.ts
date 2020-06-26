import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Group } from '../../models/group.model';
import { PendingRequest } from '../../models/pending-request.model';
import { RequestActionResponse } from '../../models/requet-action-response.model';
import { NewCodeSuccessResponse } from '../../models/group-service-response.model';
import { GenericResponse } from '../../models/generic-response.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private baseGroupUrl = `${environment.apiUrl}/groups`;
  private groupList = new BehaviorSubject<Group>(new Group());

  constructor(private http: HttpClient) {}

  getGroup(id): Observable<Group> {
    return this.http
      .get<Group>(`${this.baseGroupUrl}/${id}`)
      .pipe(
        map((group: Group) => {
          const groupObj = new Group(group);
          this.groupList.next(groupObj);
          return groupObj;
        }),
        catchError((e) => this.handleError(e))
      );
  }

  updateGroup(id: String, changes: Object): Observable<void> {
    return this.http
      .put<GenericResponse>(`${this.baseGroupUrl}/${id}`, changes)
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (_r) => {}),
        catchError((e) => this.handleError(e))
      );
  }

  getLatestGroup(): Observable<Group> {
    return this.groupList.asObservable();
  }

  getManagedRequests(
    id: string,
    sort: string[] = []
  ): Observable<PendingRequest[]> {
    let params = new HttpParams();
    if (sort.length > 0) {
      params = params.set('sort', sort.join(','));
    }
    return this.http
      .get<PendingRequest[]>(`${this.baseGroupUrl}/${id}/requests`, {
        params,
      })
      .pipe(
        map(
          (reqs: PendingRequest[]) => reqs.filter(
            (req: PendingRequest) => req.action === 'join_request_created'
          )
        ),
        catchError((e) => this.handleError(e))
      );
  }

  acceptJoinRequest(id: string, groupIds: string[]): Observable<RequestActionResponse> {
    return this.http
      .post<RequestActionResponse>(`${this.baseGroupUrl}/${id}/join-requests/accept`, null, {
        params: {
          group_ids: groupIds.join(','),
        },
      })
      .pipe(
        tap((r) => this.handleRequestActionResponse(r)),
        catchError((e) => this.handleError(e))
      );
  }

  rejectJoinRequest(id: string, groupIds: string[]): Observable<RequestActionResponse> {
    return this.http
      .post<RequestActionResponse>(`${this.baseGroupUrl}/${id}/join-requests/reject`, null, {
        params: {
          group_ids: groupIds.join(','),
        }
      })
      .pipe(
        tap((r) => this.handleRequestActionResponse(r)),
        catchError((e) => this.handleError(e))
      );
  }

  /* ****************** */

  createNewCode(id: String): Observable<string> {
    return this.http
      .post<NewCodeSuccessResponse|GenericResponse>(`${this.baseGroupUrl}/${id}/code`, null, {})
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (r:NewCodeSuccessResponse) => r.code),
        catchError((e) => this.handleError(e))
      );
  }

  removeCode(id: String): Observable<void> {
    return this.http
      .delete<GenericResponse>(`${this.baseGroupUrl}/${id}/code`)
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (_r) => {}),
        catchError((e) => this.handleError(e))
      );
  }

  /* ****************** */

  // convert response errors in observable error
  private ensureSuccessResponse(response: any) {
    if ('success' in response && response.success === false) {
      throw new Error('Service error');
    }
  }

  private handleRequestActionResponse(result: RequestActionResponse) {
    if (result.success === false || result.message !== 'updated' || typeof result.data !== 'object') {
      throw new Error('Unknown error');
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + 'body was', error.error
      );
    }

    return throwError('Something bad happened; please try again later.');
  }
}
