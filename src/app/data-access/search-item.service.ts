import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { ItemType } from '../items/models/item-type';
import { z } from 'zod';
import { decodeSnakeCase } from '../utils/operators/decode';
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
  type: z.enum([ 'Chapter', 'Task', 'Skill' ]),
  permissions: itemCorePermSchema,
});

@Injectable({
  providedIn: 'root',
})
export class SearchItemService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

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
      `${this.config.apiUrl}/items/search`,
      { params: params },
    ).pipe(
      decodeSnakeCase(z.array(itemFoundSchema))
    );
  }
}
