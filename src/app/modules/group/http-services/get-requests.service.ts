import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { map } from 'rxjs/operators';

export interface PendingRequest {
  at: Date|null,
  user: {
    id: string,
    login: string,
    firstName: string|null,
    lastName: string|null,
  },
  group: {
    id: string,
    name: string,
  },
}

interface RawGroupPendingRequest {
  at: string|null,
  group: {
    id: string,
    name: string,
  },
  user: {
    group_id: string,
    login: string,
    first_name: string|null,
    last_name: string|null,
    grade: number|null,
  },
}

export interface GroupPendingRequest extends PendingRequest {
  user: {
    id: string,
    login: string,
    firstName: string|null,
    lastName: string|null,
    grade: number|null,
  },
}

interface RawGroupInvitationRequest {
  at: string,
  action: 'invitation_created' | 'join_request_created' | 'join_request_refused',
  group: {
    name: string,
    description: string|null,
    id: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other',
  },
  group_id: string,
  inviting_user: {
    id: string,
    login: string,
    first_name: string|null,
    last_name: string|null,
  }|null,
}

interface RawGroupInvitation {
  at: string,
  action: 'invitation_created',
  group: {
    name: string,
    description: string|null,
    id: string,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other',
  },
  group_id: string,
  inviting_user: {
    id: string,
    login: string,
    first_name: string|null,
    last_name: string|null,
  },
}

export interface GroupInvitation extends PendingRequest {
  group: {
    id: string,
    name: string,
    description: string|null,
    type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other',
  },
}

function isInvitation(invitation: RawGroupInvitationRequest): invitation is RawGroupInvitation {
  return invitation.action === 'invitation_created';
}


@Injectable({
  providedIn: 'root'
})
export class GetRequestsService {

  constructor(private http: HttpClient) {}

  getGroupPendingRequests(
    groupId?: string,
    includeSubgroup : boolean = false,
    sort: string[] = [],
  ): Observable<GroupPendingRequest[]> {
    let params = new HttpParams();
    if (groupId) {
      params = params.set('group_id', groupId);
      if (includeSubgroup) params = params.set('include_descendant_groups', '1');
    }
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawGroupPendingRequest[]>(`${appConfig.apiUrl}/groups/user-requests`, { params: params })
      .pipe(
        map(pendingRequests => pendingRequests.map(r => ({
          at: r.at === null ? null : new Date(r.at),
          group: r.group,
          user: {
            id: r.user.group_id,
            login: r.user.login,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            grade: r.user.grade,
          }
        })))
      );
  }



  getGroupInvitations(
    sort: string[] = [],
  ): Observable<GroupInvitation[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<RawGroupInvitationRequest[]>(`${appConfig.apiUrl}/current-user/group-invitations`, { params: params })
      .pipe(
        map(groupInvitations => groupInvitations.filter(isInvitation).map(r => ({
          at: r.at === null ? null : new Date(r.at),
          group: {
            id: r.group.id,
            name: r.group.name,
            description: r.group.description,
            type: r.group.type,
          },
          user: {
            id: r.inviting_user.id,
            login: r.inviting_user.login,
            firstName: r.inviting_user.first_name,
            lastName: r.inviting_user.last_name,
          }
        })))
      );
  }
}
