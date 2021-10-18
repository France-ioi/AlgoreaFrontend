import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../shared/operators/decode';

const typeDecoder = D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base');
export const manageTypeDecoder = D.literal('none', 'memberships', 'memberships_and_group');

const groupDecoder = D.struct({
  id: D.string,
  name: D.string,
  description: D.nullable(D.string),
  type: typeDecoder,
  canManage: manageTypeDecoder,
  canWatchMembers: D.boolean,
  canGrantGroupAccess: D.boolean,
});

export type GroupType = D.TypeOf<typeof typeDecoder>;
export type ManageType = D.TypeOf<typeof manageTypeDecoder>;
export type Group = D.TypeOf<typeof groupDecoder>;

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user/managed-groups`)
      .pipe(
        decodeSnakeCase(D.array(groupDecoder)),
      );
  }

}


