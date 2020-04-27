import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Group } from '../../models/group.model';
import { GroupPendingRequest } from '../../models/group-pending-request.model';
import { GroupMember } from '../../models/group-member.model';
import { DEFAULT_LIMIT, GROUP_API } from '../../constants/api';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private baseUrl = `${environment.apiUrl}/groups`;
  private groupList = new Subject<Group>();
  private requestList = new Subject<GroupPendingRequest[]>();
  private memberList = new Subject<GroupMember[]>();

  constructor(
    private http: HttpClient
  ) { }

  getManagedGroup(id): Observable<Group> {
    this.http.get(`${this.baseUrl}/${id}`)
      .subscribe((group: Group) => this.groupList.next(group), this.handleError);

    return this.groupList;
  }

  getManagedRequests(id): Observable<GroupPendingRequest[]> {
    this.http.get(`${this.baseUrl}/${id}/requests`)
      .subscribe((requests: GroupPendingRequest[]) => {
        const newReqs = requests.filter((req: GroupPendingRequest) => req.action === 'join_request_created');
        this.requestList.next(newReqs);
      }, this.handleError);

    return this.requestList;
  }

  getGroupMembers(id, sort = GROUP_API.sort, limit = DEFAULT_LIMIT): Observable<GroupMember[]> {
    this.http.get(`${this.baseUrl}/${id}/members`, {
      params: {
        sort: sort
      }
    })
      .subscribe((members: GroupMember[]) => this.memberList.next(members), this.handleError);

    return this.memberList;
  }

  removeGroupMembers(id, user_ids): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/members`, {
      params: {
        user_ids: user_ids.join(',')
      }
    }).pipe(
      catchError( this.handleError )
    );
  }

  acceptJoinRequest(id, group_ids) {
    return this.http.post(`${this.baseUrl}/${id}/join-requests/accept`, null, {
      params: {
        group_ids: group_ids.join(',')
      }
    }).pipe(
      catchError( this.handleError )
    );
  }

  rejectJoinRequest(id, group_ids) {
    return this.http.post(`${this.baseUrl}/${id}/join-requests/reject`, null, {
      params: {
        group_ids: group_ids.join(',')
      }
    }).pipe(
      catchError( this.handleError )
    );
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
