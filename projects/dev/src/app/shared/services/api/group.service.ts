import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, Subject, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {
  DEFAULT_LIMIT,
} from '../../constants/api';

import { Group } from '../../models/group.model';
import { PendingRequest } from '../../models/pending-request.model';
import { Member } from '../../models/member.model';
import { MembershipHistory } from '../../models/membership-history.model';
import { GroupMembership } from '../../models/group-membership.model';
import { RequestActionResponse } from '../../models/requet-action-response.model';
import { NewCodeSuccessResponse } from '../../models/group-service-response.model';
import { GenericResponse } from '../../models/generic-response.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private baseGroupUrl = `${environment.apiUrl}/groups`;
  private baseCurrentUserUrl = `${environment.apiUrl}/current-user`;

  private groupList = new BehaviorSubject<Group>(new Group());
  private memberList = new Subject<Member[]>();
  private membershipHistoryList = new Subject<MembershipHistory[]>();
  private joinedGroupList = new Subject<GroupMembership[]>();

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
        catchError(this.handleError)
      );
  }

  updateGroup(id: String, changes: Object): Observable<void> {
    return this.http
      .put<GenericResponse>(`${this.baseGroupUrl}/${id}`, changes)
      .pipe(
        tap(this.ensureSuccessResponse),
        map( (_r) => {}),
        catchError(this.handleError)
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
        catchError(this.handleError)
      );
  }

  getGroupMembers(
    id,
    sort = [],
    _limit = DEFAULT_LIMIT
  ): Observable<Member[]> {
    this.http
      .get(`${this.baseGroupUrl}/${id}/members`, {
        params: {
          sort: sort.join(','),
        },
      })
      .subscribe(
        (members: Member[]) => this.memberList.next(members),
        this.handleError
      );

    return this.memberList;
  }

  removeGroupMembers(id, userIds): Observable<any> {
    return this.http
      .delete(`${this.baseGroupUrl}/${id}/members`, {
        params: {
          user_ids: userIds.join(','),
        },
      })
      .pipe(catchError(this.handleError));
  }

  acceptJoinRequest(id: string, groupIds: string[]): Observable<RequestActionResponse> {
    return this.http
      .post<RequestActionResponse>(`${this.baseGroupUrl}/${id}/join-requests/accept`, null, {
        params: {
          group_ids: groupIds.join(','),
        },
      })
      .pipe(
        tap(this.handleRequestActionResponse),
        catchError(this.handleError)
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
        tap(this.handleRequestActionResponse),
        catchError(this.handleError)
      );
  }

  getPendingInvitations(
    sortBy = [],
    _limit = 500
  ): Observable<MembershipHistory[]> {
    this.http
      .get(`${this.baseCurrentUserUrl}/group-memberships-history`, {
        params: {
          sort: sortBy.join(','),
        },
      })
      .subscribe(
        (memberships: MembershipHistory[]) =>
          this.membershipHistoryList.next(memberships),
        this.handleError
      );

    return this.membershipHistoryList;
  }

  getJoinedGroups(sortBy = []): Observable<GroupMembership[]> {
    this.http
      .get(`${this.baseCurrentUserUrl}/group-memberships`, {
        params: {
          sort: sortBy.join(','),
        },
      })
      .subscribe(
        (memberships: GroupMembership[]) =>
          this.joinedGroupList.next(memberships),
        this.handleError
      );

    return this.joinedGroupList;
  }

  leaveGroup(id) {
    return this.http
      .delete(`${this.baseCurrentUserUrl}/group-memberships/${id}`)
      .pipe(catchError(this.handleError));
  }

  joinGroupByCode(code, approvals = []) {
    return this.http
      .post(`${this.baseCurrentUserUrl}/group-memberships/by-code`, {
        params: {
          code,
          approvals: approvals.join(','),
        },
      })
      .pipe(catchError(this.handleError));
  }

  /* ****************** */

  createNewCode(id: String): Observable<string> {
    return this.http
      .post<NewCodeSuccessResponse|GenericResponse>(`${this.baseGroupUrl}/${id}/code`, null, {})
      .pipe(
        tap(this.ensureSuccessResponse),
        map( (r:NewCodeSuccessResponse) => r.code),
        catchError(this.handleError)
      );
  }

  removeCode(id: String): Observable<void> {
    return this.http
      .delete<GenericResponse>(`${this.baseGroupUrl}/${id}/code`)
      .pipe(
        tap(this.ensureSuccessResponse),
        map( (_r) => {}),
        catchError(this.handleError)
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
