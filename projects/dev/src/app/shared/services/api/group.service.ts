import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Observable, Subject, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import {
  DEFAULT_LIMIT,
  GROUP_MEMBERS_API,
  GROUP_REQUESTS_API,
} from "../../constants/api";

import { Group } from "../../models/group.model";
import { PendingRequest } from "../../models/pending-request.model";
import { Member } from "../../models/member.model";
import { MembershipHistory } from "../../models/membership-history.model";
import { GroupMembership } from "../../models/group-membership.model";
import { RequestActionResponse } from "../../models/requet-action-response.model";

@Injectable({
  providedIn: "root",
})
export class GroupService {
  private baseGroupUrl = `${environment.apiUrl}/groups`;
  private baseCurrentUserUrl = `${environment.apiUrl}/current-user`;

  private groupList = new Subject<Group>();
  private memberList = new Subject<Member[]>();
  private membershipHistoryList = new Subject<MembershipHistory[]>();
  private joinedGroupList = new Subject<GroupMembership[]>();

  constructor(private http: HttpClient) {}

  getManagedGroup(id): Observable<Group> {
    return this.http
      .get<Group>(`${this.baseGroupUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getManagedRequests(
    id,
    sort = GROUP_REQUESTS_API.sort
  ): Observable<PendingRequest[]> {
    return this.http
      .get<PendingRequest[]>(`${this.baseGroupUrl}/${id}/requests`, {
        params: {
          sort: sort.join(","),
        },
      })
      .pipe(
        map(
          (reqs: PendingRequest[]) => reqs.filter(
            (req: PendingRequest) => req.action === "join_request_created"
          )
        )
      )
      .pipe(catchError(this.handleError));
  }

  getGroupMembers(
    id,
    sort = GROUP_MEMBERS_API.sort,
    limit = DEFAULT_LIMIT
  ): Observable<Member[]> {
    this.http
      .get(`${this.baseGroupUrl}/${id}/members`, {
        params: {
          sort: sort.join(","),
        },
      })
      .subscribe(
        (members: Member[]) => this.memberList.next(members),
        this.handleError
      );

    return this.memberList;
  }

  removeGroupMembers(id, user_ids): Observable<any> {
    return this.http
      .delete(`${this.baseGroupUrl}/${id}/members`, {
        params: {
          user_ids: user_ids.join(","),
        },
      })
      .pipe(catchError(this.handleError));
  }

  acceptJoinRequest(id, group_ids): Observable<RequestActionResponse> {
    return this.http
      .post<RequestActionResponse>(`${this.baseGroupUrl}/${id}/join-requests/accept`, null, {
        params: {
          group_ids: group_ids.join(","),
        },
      })
      .pipe(catchError(this.handleError));
  }

  rejectJoinRequest(id, group_ids): Observable<RequestActionResponse> {
    return this.http
      .post<RequestActionResponse>(`${this.baseGroupUrl}/${id}/join-requests/reject`, null, {
        params: {
          group_ids: group_ids.join(","),
        }
      })
      .pipe(catchError(this.handleError));
  }

  getPendingInvitations(
    sort_by = [],
    limit = 500
  ): Observable<MembershipHistory[]> {
    this.http
      .get(`${this.baseCurrentUserUrl}/group-memberships-history`, {
        params: {
          sort: sort_by,
        },
      })
      .subscribe(
        (memberships: MembershipHistory[]) =>
          this.membershipHistoryList.next(memberships),
        this.handleError
      );

    return this.membershipHistoryList;
  }

  getJoinedGroups(sort_by = []): Observable<GroupMembership[]> {
    this.http
      .get(`${this.baseCurrentUserUrl}/group-memberships`, {
        params: {
          sort: sort_by,
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
          code: code,
          approvals: approvals.join(","),
        },
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error("An error occurred:", error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was`, error.error
      );
    }

    return throwError("Something bad happened; please try again later.");
  }
}
