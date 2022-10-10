import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../helpers/config';
import { assertSuccess, SimpleActionResponse } from './action-response';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from '../operators/decode';
import {
  itemCorePermDecoder,
  itemEntryFromPermDecoder,
  itemEntryUntilPermDecoder,
  itemSessionPermDecoder
} from '../models/domain/item-permissions';

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

  constructor(private http: HttpClient) { }

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissionsInfo> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`).pipe(
        decodeSnakeCase(groupPermissionsInfoDecoder),
      );
  }

  updatePermissions(sourceGroupId: string, groupId: string, itemId: string,
    permissions: Partial<GroupPermissions>): Observable<void> {

    const body = {
      can_view: permissions.canView,
      can_grant_view: permissions.canGrantView,
      can_watch: permissions.canWatch,
      can_edit: permissions.canEdit,
      can_make_session_official: permissions.canMakeSessionOfficial,
      is_owner: permissions.isOwner,
    };
    return this.http
      .put<SimpleActionResponse>(`${appConfig.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`, body)
      .pipe(map(assertSuccess));
  }
}
