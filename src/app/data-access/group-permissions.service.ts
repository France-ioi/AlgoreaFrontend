import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { assertSuccess, SimpleActionResponse } from './action-response';
import { z } from 'zod';
import { decodeSnakeCase } from '../utils/operators/decode';
import {
  itemCorePermSchema,
  itemEntryFromPermSchema,
  itemEntryUntilPermSchema,
  itemSessionPermSchema
} from '../items/models/item-permissions';

const groupPermissionsSchema = itemCorePermSchema
  .and(itemSessionPermSchema)
  .and(itemEntryFromPermSchema);

const groupPermissionsInfoSchema = z.object({
  granted: groupPermissionsSchema.and(itemEntryUntilPermSchema),
  computed: groupPermissionsSchema,
  grantedViaGroupMembership: groupPermissionsSchema,
  grantedViaItemUnlocking: groupPermissionsSchema,
  grantedViaSelf: groupPermissionsSchema,
  grantedViaOther: groupPermissionsSchema,
});

export type GroupPermissionsInfo = z.infer<typeof groupPermissionsInfoSchema>;

export type GroupPermissions = GroupPermissionsInfo['granted'];
export type GroupComputedPermissions = GroupPermissionsInfo['computed'];

@Injectable({
  providedIn: 'root'
})
export class GroupPermissionsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getPermissions(sourceGroupId: string, groupId: string, itemId: string): Observable<GroupPermissionsInfo> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${sourceGroupId}/permissions/${groupId}/${itemId}`).pipe(
        decodeSnakeCase(groupPermissionsInfoSchema),
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
