import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemType } from '../../../shared/helpers/item-type';
import { map } from 'rxjs/operators';
import { ActionResponse, successData } from '../../../shared/http-services/action-response';

interface NewItemData {
  id: string;
}

export type NewItem = {
  title: string,
  type: ItemType,
  language_tag: string
} & ({ parent: {item_id: string} } | { as_root_of_group_id: string })

@Injectable({
  providedIn: 'root'
})
export class CreateItemService {

  constructor(private http: HttpClient) {
  }

  create(newItem: NewItem): Observable<string> {
    const body: {[k: string]: any} = {
      title: newItem.title,
      type: newItem.type,
      language_tag: newItem.language_tag,
    };
    if ('parent' in newItem) body.parent = newItem.parent;
    if ('as_root_of_group_id' in newItem) body.as_root_of_group_id = newItem.as_root_of_group_id;

    return this.http
      .post<ActionResponse<NewItemData>>(`${appConfig().apiUrl}/items`, body)
      .pipe(
        map(successData),
        map(response => response.id)
      );
  }
}
