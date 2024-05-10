import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { appConfig } from 'src/app/utils/config';
import { map } from 'rxjs/operators';
import { requestTimeout } from 'src/app/interceptors/interceptor_common';
import { SECONDS } from 'src/app/utils/duration';

export interface ItemChanges {
  children?: {
    item_id: string,
    order: number,
    content_view_propagation?: 'none' | 'as_info' | 'as_content',
    edit_propagation?: boolean,
    grant_view_propagation?: boolean,
    upper_view_levels_propagation?: 'use_content_view_propagation' | 'as_content_with_descendants' | 'as_is',
    watch_propagation?: boolean,
  }[],
  url?: string | null,
  text_id?: string | null,
  uses_api?: boolean,
  validation_type?: 'None' | 'All' | 'AllButOne' | 'Categories' | 'One' | 'Manual',
  no_score?: boolean,
  title_bar_visible?: boolean,
  full_screen?: 'forceYes' | 'forceNo' | 'default',
  children_layout?: 'List' | 'Grid',
  prompt_to_join_group_by_code?: boolean,
  allows_multiple_attempts?: boolean,
  requires_explicit_entry?: boolean,
  duration?: string | null,
  entering_time_min?: Date,
  entering_time_max?: Date,
  entry_participant_type?: 'Team' | 'User',
  entry_frozen_teams?: boolean,
  entry_max_team_size?: number,
  entry_min_admitted_members_ratio?: 'All' | 'Half' | 'One' | 'None',
}

const serviceTimeout = 20*SECONDS;

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
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}`, changes, {
      context: new HttpContext().set(requestTimeout, serviceTimeout),
    }).pipe(
      map(assertSuccess),
    );
  }
}
