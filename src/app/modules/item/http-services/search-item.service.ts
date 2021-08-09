import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../shared/helpers/config';
import { ItemType } from '../../../shared/helpers/item-type';
import { permissionsDecoder, PermissionsInfo } from '../helpers/item-permissions';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';

export interface ItemFound<T> {
  id: string,
  title: string,
  type: T,
  permissions: PermissionsInfo,
}

export const itemFoundDecoder = D.struct({
  id: D.string,
  title: D.string,
  type: D.literal('Chapter','Task','Course','Skill'),
  permissions: permissionsDecoder,
});

@Injectable({
  providedIn: 'root',
})
export class SearchItemService {

  constructor(private http: HttpClient) {
  }

  search(
    searchString: string,
    includedTypes?: ItemType[],
    excludedTypes?: ItemType[],
    limit = 5,
  ): Observable<ItemFound<ItemType>[]> {
    let params = new HttpParams().set('search', searchString).set('limit', limit.toString());

    if (includedTypes) params = params.set('types_include', includedTypes.join(','));
    if (excludedTypes) params = params.set('types_exclude', excludedTypes.join(','));

    return this.http.get<unknown[]>(
      `${appConfig.apiUrl}/items/search`,
      { params: params },
    ).pipe(
      decodeSnakeCase(D.array(itemFoundDecoder))
    );
  }
}
