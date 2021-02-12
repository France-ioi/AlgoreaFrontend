import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assertSuccess, SimpleActionResponse } from '../../../shared/http-services/action-response';
import { appConfig } from '../../../shared/helpers/config';
import { map } from 'rxjs/operators';

export interface ItemChanges {
  children?: { item_id: string, order: number }[],
  url?: string | null,
  text_id?: string | null,
  uses_api?: boolean,
  validation_type?: string,
  no_score?: boolean,
  title_bar_visible?: boolean,
  full_screen?: string,
  prompt_to_join_group_by_code?: boolean,
}

@Injectable({
  providedIn: 'root',
})
export class UpdateItemService {

  constructor(private http: HttpClient) {
  }

  updateItem(
    itemId: string,
    changes: ItemChanges,
  ): Observable<void> {
    return this.http.put<SimpleActionResponse>(
      `${appConfig().apiUrl}/items/${itemId}`,
      changes,
      { headers: { timeout: '20000' } },
    ).pipe(
      map(assertSuccess),
    );
  }
}
