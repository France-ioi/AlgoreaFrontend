import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemType } from '../../../shared/helpers/item-type';
import { map } from 'rxjs/operators';

interface RawNewItem {
  data: { id: string },
  message: string,
  success: boolean
}

interface NewItem {
  title: string,
  type: ItemType,
  language_tag: string,
  parent?: { item_id: string },
  as_root_of_group_id?: string
}

@Injectable({
  providedIn: 'root'
})
export class CreateItemService {

  constructor(private http: HttpClient) {
  }

  create(
    title: string | null,
    type: ItemType,
    languageTag: string,
    parentId?: string
  ): Observable<string> {
    const body: NewItem = {
      title: title || '',
      type: type,
      language_tag: languageTag,
    };

    if (parentId) body.parent = { item_id: parentId };

    return this.http.post<RawNewItem>(
      `${appConfig().apiUrl}/items`,
      body,
    ).pipe(map(response => response.data.id));
  }
}
