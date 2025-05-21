import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { assertSuccess, SimpleActionResponse } from './action-response';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from '../utils/operators/decode';
import {
  itemCorePermDecoder,
  itemEntryFromPermDecoder,
  itemEntryUntilPermDecoder,
  itemSessionPermDecoder
} from '../items/models/item-permissions';

const groupPermissionsDecoder = pipe(
  itemCorePermDecoder,
  D.intersect(itemSessionPermDecoder),
  D.intersect(itemEntryFromPermDecoder),
);

const groupPermissionsInfoDecoder = D.struct({
  granted: D.intersect(groupPermissionsDecoder)(itemEntryUntilPermDecoder),
  computed: groupPermissionsDecoder,
  grantedViaGroupMembership: groupPermissionsDecoder,
  grantedViaItemUnlocking: groupPermissionsDecoder,
  grantedViaSelf: groupPermissionsDecoder,
  grantedViaOther: groupPermissionsDecoder,
});

export type GroupPermissionsInfo = D.TypeOf<typeof groupPermissionsInfoDecoder>;

export type GroupPermissions = GroupPermissionsInfo['granted'];
export type GroupComputedPermissions = GroupPermissionsInfo['computed'];

@Injectable({
  providedIn: 'root'
})
export class GroupPermissionsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissionsInfo> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`).pipe(
        decodeSnakeCase(groupPermissionsInfoDecoder),
      );
  }

  updatePermissions(sourceGroupId: string, groupId: string, itemId: string,
    permissions: Partial<GroupPermissions>): Observable<void> {

    const body = {
      ...(permissions.canEnterFrom && permissions.canEnterUntil ? {
        can_enter_from: permissions.canEnterFrom,
        can_enter_until: permissions.canEnterUntil,
      } : {}),
      can_view: permissions.canView,
      can_grant_view: permissions.canGrantView,
      can_watch: permissions.canWatch,
      can_edit: permissions.canEdit,
      can_make_session_official: permissions.canMakeSessionOfficial,
      is_owner: permissions.isOwner,
    };
    return this.http
      .put<SimpleActionResponse>(`${this.config.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`, body)
      .pipe(map(assertSuccess));
  }
}
