import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash-es';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';

interface ItemStrings {
  title: string,
  language_tag: string,
}

interface RootActivity {
  // Some attributes are omitted as they are not used for the moment. Read the doc for the full list.
  group_id: string,
  name: string,
  activity: {
    id: string,
    string: ItemStrings,
    type: ItemType,
    best_score: number,
    has_visible_children: boolean,
    results: {
      attempt_id: string,
      latest_activity_at: string|null,
      started_at: string|null,
    }[]
  }
}

interface NavData {
  id: string,
  attempt_id: string,
  string: ItemStrings,
  type: ItemType,
  children: {
    id: string,
    string: ItemStrings,
    type: ItemType,
    best_score: number,
    has_visible_children: boolean,
    results: {
      attempt_id: string,
      latest_activity_at: string|null,
      started_at: string|null,
    }[]
  }[]
}

export type ItemType = 'Chapter'|'Task'|'Course'|'Skill';

export interface Item {
  id: string,
  title: string,
  hasChildren: boolean,
  groupName?: string,
  attemptId: string|null,
}

export interface MenuItems {
  parent?: any,
  children: Item[]
}

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService {

  constructor(private http: HttpClient) {}

  getNavData(parentItemId: string, attemptId: string): Observable<MenuItems> {
    return this.http
      .get<NavData>(`${environment.apiUrl}/items/${parentItemId}/navigation`, {
        params: { attempt_id: attemptId }
      })
      .pipe(
        map((data) => {
          return {
            parent: 'tbd',
            children: _.map(data.children, (i) => {
              const attempt = bestAttemptFromResults(i.results);
              return {
                id: i.id,
                title: i.string.title,
                hasChildren: i.has_visible_children,
                attemptId: attempt ? attempt.attempt_id : null,
              };
            }),
          };
        })
      );
  }

  getRootActivities(): Observable<MenuItems> {
    return this.http
      .get<RootActivity[]>(`${environment.apiUrl}/current-user/group-memberships/activities`)
      .pipe(
        map((acts) => {
          const childrenItems = _.map(acts, (act) => {
            const attempt = bestAttemptFromResults(act.activity.results);
            return {
              id: act.activity.id,
              title: act.activity.string.title,
              hasChildren: act.activity.has_visible_children,
              groupName: act.name,
              attemptId: attempt ? attempt.attempt_id : null,
            };
          });
          return { children: childrenItems };
        })
      );
  }
}
