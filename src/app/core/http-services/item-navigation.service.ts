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

interface ActivityOrSkill {
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

interface RootActivity {
  // Some attributes are omitted as they are not used for the moment. Read the doc for the full list.
  group_id: string,
  name: string,
  activity: ActivityOrSkill
}

interface RootSkill {
  group_id: string,
  name: string,
  skill: ActivityOrSkill
}

interface RawNavData {
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
    }[]|null,
  }[]
}

export type ItemType = 'Chapter'|'Task'|'Course'|'Skill';

export interface NavMenuItem {
  id: string,
  title: string,
  hasChildren: boolean,
  groupName?: string,
  attemptId: string|null,
  children?: NavMenuItem[] // placeholder for children when fetched (may 'hasChildren' with 'children' not set)
}

export interface NavMenuRootItem {
  parent?: NavMenuItem,
  items: NavMenuItem[]
}

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService {

  constructor(private http: HttpClient) {}

  /**
   * One of attemptId, childAttemptId must be given (may require to start a result).
   * If both are given, it is ok, only the attempt will be used.
   */
  getNavData(parentItemId: string, attemptId?: string, childAttemptId?: string): Observable<NavMenuRootItem> {
    const parameters = (attemptId) ? { attempt_id: attemptId } : { child_attempt_id: childAttemptId };
    return this.http
      .get<RawNavData>(`${environment.apiUrl}/items/${parentItemId}/navigation`, {
        params: parameters
      })
      .pipe(
        map((data) => {
          return {
            parent: {
              id: data.id,
              title: data.string.title,
              hasChildren: data.children !== null && data.children.length > 0,
              attemptId: data.attempt_id,
            },
            items: data.children === null ? [] : _.map(data.children, (i) => {
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

  getRootActivities(): Observable<NavMenuRootItem> {
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
          return { items: childrenItems };
        })
      );
  }

  getRootSkills(): Observable<NavMenuRootItem> {
    return this.http
      .get<RootSkill[]>(`${environment.apiUrl}/current-user/group-memberships/skills`)
      .pipe(
        map((skills) => {
          const childrenItems = _.map(skills, (sk) => {
            const attempt = bestAttemptFromResults(sk.skill.results);
            return {
              id: sk.skill.id,
              title: sk.skill.string.title,
              hasChildren: sk.skill.has_visible_children,
              groupName: sk.name,
              attemptId: attempt ? attempt.attempt_id : null,
            };
          });
          return { items: childrenItems };
        })
      );
  }

  getRoot(type: 'activity'|'skill'): Observable<NavMenuRootItem> {
    if (type === 'activity') return this.getRootActivities();
    else return this.getRootSkills();
  }

}
