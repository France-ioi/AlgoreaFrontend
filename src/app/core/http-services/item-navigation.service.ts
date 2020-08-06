import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash-es';
import { map } from 'rxjs/operators';

interface ItemStrings {
  title: string,
  language_tag: string,
}

interface RootActivity {
  // Some attributes are omitted as they are not used for the moment. Read the doc for the full list.
  group_id: string,
  name: string,
  activity: {
    id: number,
    string: ItemStrings,
    type: ItemType,
    best_score: number,
    has_visible_children: boolean,
    results: {
      attempt_id: string
    }[]
  }
}

export type ItemType = 'Chapter'|'Task'|'Course'|'Skill';

export interface Item {
  id: number,
  title: string,
  hasChildren: boolean,
  groupName?: string,
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

  // getNavData(rootId: string): Observable<RootItem> {
  //   return this.http
  //     .get<RootItem>(`${environment.apiUrl}/items/${rootId}/navigation`);
  // }

  getRootActivities(): Observable<MenuItems> {
    return this.http
      .get<RootActivity[]>(`${environment.apiUrl}/current-user/group-memberships/activities`)
      .pipe(
        map((acts) => {
          const childrenItems = _.map(acts, (act) => {
            return {
              id: act.activity.id,
              title: act.activity.string.title,
              hasChildren: act.activity.has_visible_children,
              groupName: act.name
            };
          });
          return { children: childrenItems };
        })
      );
  }

}
