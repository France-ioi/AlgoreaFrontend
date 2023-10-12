import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { appConfig } from '../../utils/config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { pipe } from 'fp-ts/function';
import { itemCorePermDecoder, itemEntryTimePermDecoder, itemSessionPermDecoder } from 'src/app/models/item-permissions';

const groupPermissionsDecoder = pipe(
  itemCorePermDecoder,
  D.intersect(itemSessionPermDecoder),
  D.intersect(itemEntryTimePermDecoder),
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
