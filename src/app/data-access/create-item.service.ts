import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { ItemType } from '../items/models/item-type';
import { map } from 'rxjs/operators';
import { ActionResponse, successData } from '../data-access/action-response';

interface NewItemData {
  id: string,
}

export type NewItem = {
  title: string,
  url?: string,
  type: ItemType,
  languageTag: string,
} & ({ parent: string } | { asRootOfGroupId: string });

@Injectable({
  providedIn: 'root'
})
export class CreateItemService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  create(newItem: NewItem): Observable<string> {
    const body: {[k: string]: any} = {
      title: newItem.title,
      url: newItem.url,
      type: newItem.type,
      language_tag: newItem.languageTag,
    };
    if ('parent' in newItem) body.parent = { item_id: newItem.parent };
    if ('asRootOfGroupId' in newItem) body.as_root_of_group_id = newItem.asRootOfGroupId;

    return this.http
      .post<ActionResponse<NewItemData>>(`${this.config.apiUrl}/items`, body)
      .pipe(
        map(successData),
        map(response => response.id)
      );
  }
}
