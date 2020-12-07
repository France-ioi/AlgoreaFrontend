import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemType } from '../../../shared/helpers/item-type';
import { map } from 'rxjs/operators';
import { ActionResponse, successData } from '../../../shared/http-services/action-response';

interface NewItemData {
  id: string;
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
    parentId?: string,
    groupId?: string
  ): Observable<string> {
    const body: NewItem = {
      title: title || '',
      type: type,
      language_tag: languageTag,
    };

    if (!(parentId || groupId)) return throwError(new Error('Parent id and as_root_of_group_id not given.'));
    if (parentId) body.parent = { item_id: parentId };
    if (groupId) body.as_root_of_group_id = groupId;

    return this.http
      .post<ActionResponse<NewItemData>>(`${appConfig().apiUrl}/items`, body)
      .pipe(
        map(successData),
        map(response => response.id)
      );
  }
}
