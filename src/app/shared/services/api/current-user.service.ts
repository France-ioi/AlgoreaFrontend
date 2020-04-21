import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subject, throwError } from 'rxjs';
import { MembershipHistory } from '../../models/membership-history.model';
import { GroupMembership } from '../../models/group-membership.model';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  private baseUrl = `${environment.apiUrl}/current-user`;
  private membershipHistoryList = new Subject<MembershipHistory[]>();
  private joinedGroupList = new Subject<GroupMembership[]>();

  constructor(
    private http: HttpClient
  ) { }

  getPendingInvitations(sort_by = [], limit = 500) : Observable<MembershipHistory[]> {
    this.http.get(`${this.baseUrl}/group-memberships-history`, {
      params: {
        sort: sort_by
      }
    })
    .subscribe((memberships: MembershipHistory[]) => this.membershipHistoryList.next(memberships), this.handleError);

    return this.membershipHistoryList;
  }

  getJoinedGroups(sort_by = []) : Observable<GroupMembership[]> {
    this.http.get(`${this.baseUrl}/group-memberships`, {
      params: {
        sort: sort_by
      }
    })
    .subscribe((memberships: GroupMembership[]) => this.joinedGroupList.next(memberships), this.handleError);

    return this.joinedGroupList;
  }

  leaveGroup(id) {
    return this.http.delete(`${this.baseUrl}/group-memberships/${id}`)
            .pipe(
              catchError( this.handleError )
            );
  }

  joinGroupByCode(code, approvals = []) {
    return this.http.post(`${this.baseUrl}/group-memberships/by-code`, {
      params: {
        code: code,
        approvals: approvals.join(',')
      }
    })
    .pipe(
      catchError( this.handleError )
    )
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }

    return throwError('Something bad happened; please try again later.');
  }
}
