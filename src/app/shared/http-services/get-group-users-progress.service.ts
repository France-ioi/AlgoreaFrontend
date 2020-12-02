import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

interface RawGroupUsersProgress {
  group_id: string,
  hints_requested: number,
  item_id: string,
  latest_activity_at: string|null,
  score: number,
  submissions: number,
  time_spent: number,
  validated: boolean,
}

export interface GroupUsersProgress {
  groupId: string,
  hintsRequested: number,
  itemId: string,
  latestActivityAt: Date|null,
  score: number,
  submissions: number,
  timeSpent: number,
  validated: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupUsersProgressService {

  constructor(private http: HttpClient) { }

  getGroupUsersProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<GroupUsersProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<RawGroupUsersProgress[]>(`${appConfig().apiUrl}/groups/${groupId}/user-progress`, { params: params })
      .pipe(
        map(rawGroupUsersProgress => rawGroupUsersProgress.map(m => ({
          groupId: m.group_id,
          hintsRequested: m.hints_requested,
          itemId: m.item_id,
          latestActivityAt: m.latest_activity_at === null ? null : new Date(m.latest_activity_at),
          score: m.score,
          submissions: m.submissions,
          timeSpent: m.time_spent,
          validated: m.validated,
        })))
      );
  }
}
