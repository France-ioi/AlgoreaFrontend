import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../helpers/config';
import { assertSuccess, SimpleActionResponse } from './action-response';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const permissionsDecoder = pipe(
  D.struct({
    canView: D.literal('none','info','content','content_with_descendants','solution'),
    canWatch: D.literal('none','result','answer','answer_with_grant'),
    canEdit: D.literal('none','children','all','all_with_grant'),
    canGrantView: D.literal('none','enter','content','content_with_descendants','solution','solution_with_grant'),
    isOwner: D.boolean,
    canMakeSessionOfficial: D.boolean,
  })
);

export type Permissions = D.TypeOf<typeof permissionsDecoder>;

const groupPermissionsDecoder = pipe(
  D.struct({
    granted: permissionsDecoder,
    computed: permissionsDecoder,
    grantedViaGroupMembership: permissionsDecoder,
    grantedViaItemUnlocking: permissionsDecoder,
    grantedViaSelf: permissionsDecoder,
    grantedViaOther: permissionsDecoder,
  })
);

export type GroupPermissions = D.TypeOf<typeof groupPermissionsDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GroupPermissionsService {

  constructor(private http: HttpClient) { }

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissions> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`)
      .pipe(
        decodeSnakeCase(groupPermissionsDecoder),
      );
  }

  updatePermissions(sourceGroupId: string, groupId: string, itemId: string, permissions: Permissions): Observable<void> {
    return this.http
      .put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`, {
        can_edit: permissions.canEdit,
        can_grant_view: permissions.canGrantView,
        can_make_session_official: permissions.canMakeSessionOfficial,
        can_view: permissions.canView,
        can_watch: permissions.canWatch,
        is_owner: permissions.isOwner,
      })
      .pipe(map(assertSuccess));
  }
}
