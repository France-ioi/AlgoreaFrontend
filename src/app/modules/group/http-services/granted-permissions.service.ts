import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import { dateDecoder } from '../../../shared/helpers/decoders';
import { appConfig } from '../../../shared/helpers/config';
import { HttpClient, HttpParams } from '@angular/common/http';

const groupPermissionsDecoder = D.struct({
  canEdit: D.literal('none', 'children', 'all', 'all_with_grant'),
  canEnterFrom: dateDecoder,
  canEnterUntil: dateDecoder,
  canGrantView: D.literal('none', 'enter', 'content', 'content_with_descendants', 'solution', 'solution_with_grant'),
  canMakeSessionOfficial: D.boolean,
  canView: D.literal('none', 'info', 'content', 'content_with_descendants', 'solution'),
  canWatch: D.literal('none', 'result', 'answer', 'answer_with_grant'),
  isOwner: D.boolean,
});

const grantedPermissionsDecoder = D.struct({
  group: D.struct({
    id: D.string,
    name: D.string,
  }),
  item: D.struct({
    id: D.string,
    languageTag: D.string,
    requiresExplicitEntry: D.boolean,
    title: D.nullable(D.string),
  }),
  permissions: groupPermissionsDecoder,
  sourceGroup: D.struct({
    id: D.string,
    name: D.string,
  }),
});

export type GroupPermissions = D.TypeOf<typeof groupPermissionsDecoder>;
export type GrantedPermissions = D.TypeOf<typeof grantedPermissionsDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GrantedPermissionsService {
  constructor(private http: HttpClient) {
  }

  get(id: string, descendants = 0): Observable<GrantedPermissions[]> {
    const httpParams = new HttpParams().set('descendants', descendants);
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${ id }/granted_permissions`, {
      params: httpParams,
    }).pipe(
      decodeSnakeCase(D.array(grantedPermissionsDecoder)),
    );
  }
}