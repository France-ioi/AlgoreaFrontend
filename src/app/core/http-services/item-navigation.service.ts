import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
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
    }[],
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

  getNavData(itemId: string, attemptId: string): Observable<NavMenuRootItem> {
    return this.getNavDataGeneric(itemId, { attempt_id: attemptId});
  }

  getNavDataFromChildAttempt(itemId: string, childAttemptId: string): Observable<NavMenuRootItem> {
    return this.getNavDataGeneric(itemId, { child_attempt_id: childAttemptId});
  }

  private getNavDataGeneric(itemId: string, parameters: {[param: string]: string}): Observable<NavMenuRootItem> {
    return this.http
      .get<RawNavData>(`${environment.apiUrl}/items/${itemId}/navigation`, {
        params: parameters
      })
      .pipe(
        map<RawNavData,NavMenuRootItem>((data: RawNavData): NavMenuRootItem => ({
          parent: {
            id: data.id,
            title: data.string.title,
            hasChildren: data.children !== null && data.children.length > 0,
            attemptId: data.attempt_id,
          },
          items: data.children === null ? [] : data.children.map((i) => ({
            id: i.id,
            title: i.string.title,
            hasChildren: i.has_visible_children,
            attemptId: bestAttemptFromResults(i.results)?.attempt_id || null,
          })),
        }))
      );
  }

  getRootActivities(): Observable<NavMenuRootItem> {
    return this.http
      .get<RootActivity[]>(`${environment.apiUrl}/current-user/group-memberships/activities`)
      .pipe(
        map((acts) => ({
          items: acts.map((act) => ({
            id: act.activity.id,
            title: act.activity.string.title,
            hasChildren: act.activity.has_visible_children,
            groupName: act.name,
            attemptId: bestAttemptFromResults(act.activity.results)?.attempt_id || null,
          }))
        }))
      );
  }

  getRootSkills(): Observable<NavMenuRootItem> {
    return this.http
      .get<RootSkill[]>(`${environment.apiUrl}/current-user/group-memberships/skills`)
      .pipe(
        map((skills) => ({
          items: skills.map((sk) => ({
            id: sk.skill.id,
            title: sk.skill.string.title,
            hasChildren: sk.skill.has_visible_children,
            groupName: sk.name,
            attemptId: bestAttemptFromResults(sk.skill.results)?.attempt_id || null,
          }))
        }))
      );
  }

  getRoot(type: 'activity'|'skill'): Observable<NavMenuRootItem> {
    if (type === 'activity') return this.getRootActivities();
    else return this.getRootSkills();
  }

}
