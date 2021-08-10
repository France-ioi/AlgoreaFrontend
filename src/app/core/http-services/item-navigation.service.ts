import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';
import { isASkill, isSkill, ItemType, ItemTypeCategory } from 'src/app/shared/helpers/item-type';

interface ItemStrings {
  title: string|null,
  language_tag: string,
}

interface ActivityOrSkill {
  id: string,
  string: ItemStrings,
  type: ItemType,
  best_score: number,
  no_score: boolean,
  has_visible_children: boolean,
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  },
  results: RawResult[]
}

export interface RootActivity {
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

interface RawResult {
  attempt_id: string,
  /* on 10/2020, the service defines latest_activity_at as nullable but this should be a mistake. The bug has been submitted. */
  latest_activity_at: string,
  started_at: string|null,
  score_computed: number,
  validated: boolean,
}

interface RawNavData {
  id: string,
  attempt_id: string,
  string: ItemStrings,
  type: ItemType,
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  },
  children: {
    id: string,
    string: ItemStrings,
    type: ItemType,
    best_score: number,
    no_score: boolean,
    has_visible_children: boolean,
    permissions: {
      can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
    },
    results: RawResult[],
  }[]
}

interface Result {
  attemptId: string,
  latestActivityAt: Date,
  startedAt: Date|null,
  score: number,
  validated: boolean,
}

// exported nav menu structure
export interface NavMenuItem {
  id: string,
  title: string, // not null to implement NavTreeElement
  hasChildren: boolean,
  groupName?: string,
  attemptId: string|null,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
  canViewContent: boolean,
  children?: NavMenuItem[], // placeholder for children when fetched (may 'hasChildren' with 'children' not set)
  disabled: boolean,
}

export interface NavMenuRootItem {
  parent?: NavMenuItem,
  items: NavMenuItem[]
}


export interface NavMenuRootItemWithParent extends NavMenuRootItem {
  parent: NavMenuItem,
}

function rawResultToResult(r: RawResult): Result {
  return {
    attemptId: r.attempt_id,
    latestActivityAt: new Date(r.latest_activity_at),
    startedAt: r.started_at === null ? null : new Date(r.started_at),
    score: r.score_computed,
    validated: r.validated,
  };
}

function createNavMenuItem(raw: {
  id: string,
  string: ItemStrings,
  has_visible_children: boolean,
  results?: RawResult[],
  no_score: boolean,
  best_score: number,
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  },
}): NavMenuItem {
  const currentResult = raw.results ? bestAttemptFromResults(raw.results.map(rawResultToResult)) : undefined;
  return {
    id: raw.id,
    title: raw.string.title ?? '',
    hasChildren: raw.has_visible_children && ![ 'none', 'info' ].includes(raw.permissions.can_view),
    attemptId: currentResult?.attemptId ?? null,
    canViewContent: [ 'content','content_with_descendants','solution' ].includes(raw.permissions.can_view),
    bestScore: raw.no_score ? undefined : raw.best_score,
    currentScore: raw.no_score ? undefined : currentResult?.score,
    validated: raw.no_score ? undefined : currentResult?.validated,
    disabled: raw.permissions.can_view === 'info',
  };
}

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService {

  constructor(private http: HttpClient) {}

  getNavData(itemId: string, attemptId: string, skillsOnly = false): Observable<NavMenuRootItemWithParent> {
    return this.getNavDataGeneric(itemId, { attempt_id: attemptId }, skillsOnly);
  }

  getNavDataFromChildRoute(itemId: string, childRoute: FullItemRoute, skillsOnly = false): Observable<NavMenuRootItemWithParent> {
    return this.getNavDataGeneric(
      itemId,
      isRouteWithSelfAttempt(childRoute) ? { child_attempt_id: childRoute.attemptId } : { attempt_id: childRoute.parentAttemptId },
      skillsOnly
    );
  }

  private getNavDataGeneric(itemId: string, parameters: {[param: string]: string}, skillsOnly: boolean):
    Observable<NavMenuRootItemWithParent> {

    return this.http
      .get<RawNavData>(`${appConfig.apiUrl}/items/${itemId}/navigation`, {
        params: parameters
      })
      .pipe(
        map((data: RawNavData) => ({
          parent: {
            id: data.id,
            title: data.string.title ?? '',
            canViewContent: [ 'content','content_with_descendants','solution' ].includes(data.permissions.can_view),
            hasChildren: data.children !== null && data.children.length > 0,
            attemptId: data.attempt_id,
            disabled: data.permissions.can_view === 'info',
          },
          items: data.children === null ? [] : data.children.filter(i => !skillsOnly || isASkill(i)).map(i => createNavMenuItem(i)),
        }))
      );
  }

  getRootActivities(watchedGroupId?: string): Observable<RootActivity[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http
      .get<RootActivity[]>(`${appConfig.apiUrl}/current-user/group-memberships/activities`, {
        params: httpParams
      });
  }

  getRootActivitiesForNavMenu(): Observable<NavMenuRootItem> {
    return this.getRootActivities().pipe(
      map(acts => ({
        items: acts.map(act => ({ ...createNavMenuItem(act.activity), groupName: act.name }))
      }))
    );
  }

  getRootSkillsForNavMenu(): Observable<NavMenuRootItem> {
    return this.http
      .get<RootSkill[]>(`${appConfig.apiUrl}/current-user/group-memberships/skills`)
      .pipe(
        map(skills => ({
          items: skills.map(sk => ({ ...createNavMenuItem(sk.skill), groupName: sk.name }))
        }))
      );
  }

  getRoot(type: ItemTypeCategory): Observable<NavMenuRootItem> {
    return (isSkill(type)) ? this.getRootSkillsForNavMenu() : this.getRootActivitiesForNavMenu();
  }

  getNavigationNeighbors(itemRoute: FullItemRoute):
    Observable<{ parent: FullItemRoute|null, left: FullItemRoute|null, right: FullItemRoute|null }> {

    const parentId = itemRoute.path[itemRoute.path.length - 1];

    // Root activity => no parent/left/right activity
    if (!parentId) return of({ parent: null, left: null, right: null });

    return this.getNavDataFromChildRoute(parentId, itemRoute).pipe(map(navParent => {
      const index = navParent.items.findIndex(item => item.id === itemRoute.id);
      if (index === -1) throw new Error('Unexpected: item is missing from its parent children list');

      const parentAttemptId = navParent.parent.attemptId;
      if (parentAttemptId === null) throw new Error('Unexpected: parent of an item node has no attempt');

      const leftItem = navParent.items[index - 1];
      const left: FullItemRoute|null = leftItem ? {
        id: leftItem.id,
        contentType: itemRoute.contentType,
        ...(leftItem.attemptId ? { attemptId: leftItem.attemptId } : { parentAttemptId }),
        path: itemRoute.path,
      } : null;

      const rightItem = navParent.items[index + 1];
      const right: FullItemRoute|null = rightItem ? {
        id: rightItem.id,
        contentType: itemRoute.contentType,
        ...(rightItem.attemptId ? { attemptId: rightItem.attemptId } : { parentAttemptId }),
        path: itemRoute.path,
      } : null;

      const parent: FullItemRoute = {
        id: parentId,
        contentType: itemRoute.contentType,
        path: itemRoute.path.slice(0, -1),
        attemptId: parentAttemptId,
      };

      return { parent, left, right };
    }));
  }
}
