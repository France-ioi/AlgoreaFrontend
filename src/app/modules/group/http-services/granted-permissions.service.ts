import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import { dateDecoder } from '../../../shared/helpers/decoders';
import { appConfig } from '../../../shared/helpers/config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { permissionsDecoder } from '../../../shared/helpers/group-permissions';
import { pipe } from 'fp-ts/function';

const groupPermissionsDecoder = pipe(
  permissionsDecoder,
  D.intersect(
    D.struct({
      canEnterFrom: dateDecoder,
      canEnterUntil: dateDecoder,
    })
  ),
);

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
