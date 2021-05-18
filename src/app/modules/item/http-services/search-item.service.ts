import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../shared/helpers/config';
import { ItemType } from '../../../shared/helpers/item-type';

export interface ItemFound<T> {
  id: string,
  title: string,
  type: T
}

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
    limit = 4,
  ): Observable<ItemFound<ItemType>[]> {
    let params = new HttpParams().set('search', searchString).set('limit', limit.toString());

    if (includedTypes) params = params.set('types_include', includedTypes.join(','));
    if (excludedTypes) params = params.set('types_exclude', excludedTypes.join(','));

    return this.http.get<ItemFound<ItemType>[]>(
      `${appConfig.apiUrl}/items/search`,
      { params: params },
    );
  }
}
