import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import { ItemType, itemTypeSchema } from '../items/models/item-type';
import { z } from 'zod';
import { decodeSnakeCaseZod } from '../utils/operators/decode';
import { ItemCorePerm, itemCorePermSchema } from '../items/models/item-permissions';

export interface ItemFound<T> {
  id: string,
  title: string,
  type: T,
  permissions: ItemCorePerm,
}

const itemFoundSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: itemTypeSchema,
  permissions: itemCorePermSchema,
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
    limit = 11,
  ): Observable<ItemFound<ItemType>[]> {
    let params = new HttpParams().set('search', searchString).set('limit', limit.toString());

    if (includedTypes) params = params.set('types_include', includedTypes.join(','));
    if (excludedTypes) params = params.set('types_exclude', excludedTypes.join(','));

    return this.http.get<unknown[]>(
      `${appConfig.apiUrl}/items/search`,
      { params: params },
    ).pipe(
      decodeSnakeCaseZod(z.array(itemFoundSchema))
    );
  }
}
