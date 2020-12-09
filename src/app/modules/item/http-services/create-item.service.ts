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
    return this.http
      .post<ActionResponse<NewItemData>>(`${appConfig().apiUrl}/items`, newItem)
      .pipe(
        map(successData),
        map(response => response.id)
      );
  }
}
