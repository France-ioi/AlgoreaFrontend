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
  validation_type?: 'None' | 'All' | 'AllButOne' | 'Categories' | 'One' | 'Manual',
  no_score?: boolean,
  title_bar_visible?: boolean,
  full_screen?: 'forceYes' | 'forceNo' | 'default',
  prompt_to_join_group_by_code?: boolean,
  allows_multiple_attempts?: boolean,
  requires_explicit_entry?: boolean,
  duration?: string | null,
  entering_time_min?: Date,
  entering_time_max?: Date,
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
