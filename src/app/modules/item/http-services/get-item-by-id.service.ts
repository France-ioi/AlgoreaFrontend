import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemType } from 'src/app/shared/helpers/item-type';

export interface Item {
  id: string,
  requires_explicit_entry: boolean
  string: {
    title: string|null,
    subtitle?: string|null,
    description?: string|null,
  },
  best_score: number,
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
    can_edit: 'none'|'children'|'all'|'all_with_grant',
    can_grant_view: 'none'|'enter'|'content'|'content_with_descendants'|'solution'|'solution_with_grant',
  },
  type: ItemType,
  prompt_to_join_group_by_code: boolean,
  url?: string,
}

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Item> {
    return this.http
      .get<Item>(`${appConfig().apiUrl}/items/${id}`);
  }

}
