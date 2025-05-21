import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { pipe } from 'fp-ts/function';
import { itemCorePermDecoder, itemEntryTimePermDecoder, itemSessionPermDecoder } from 'src/app/items/models/item-permissions';

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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  get(id: string, descendants = 0): Observable<GrantedPermissions[]> {
    const httpParams = new HttpParams().set('descendants', descendants);
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${ id }/granted_permissions`, {
      params: httpParams,
    }).pipe(
      decodeSnakeCase(D.array(grantedPermissionsDecoder)),
    );
  }
}
