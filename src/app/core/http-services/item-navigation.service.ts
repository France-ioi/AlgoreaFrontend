import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';
import { isASkill, isSkill, ItemType, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { permissionsDecoder } from 'src/app/modules/item/helpers/item-permissions';
import { dateDecoder } from 'src/app/shared/helpers/decoders';

interface ItemStrings {
  title: string|null,
  language_tag: string,
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
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  },
  children: {
    id: string,
    string: ItemStrings,
    type: ItemType,
    best_score: number,
    no_score: boolean,
    has_visible_children: boolean,
    permissions: {
      can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
    },
    results: RawResult[],
  }[],
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
  children?: NavMenuItem[], // placeholder for children when fetched (may 'hasChildren' with 'children' not set)
  locked: boolean,
}

export interface NavMenuRootItem {
  parent?: NavMenuItem,
  items: NavMenuItem[],
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
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  },
}): NavMenuItem {
  const currentResult = raw.results ? bestAttemptFromResults(raw.results.map(rawResultToResult)) : undefined;
  return {
    id: raw.id,
    title: raw.string.title ?? '',
    hasChildren: raw.has_visible_children && ![ 'none', 'info' ].includes(raw.permissions.can_view),
    attemptId: currentResult?.attemptId ?? null,
    bestScore: raw.no_score ? undefined : raw.best_score,
    currentScore: raw.no_score ? undefined : currentResult?.score,
    validated: raw.no_score ? undefined : currentResult?.validated,
    locked: raw.permissions.can_view === 'info',
  };
}

const itemNavigationChildDecoderBase = pipe(
  D.struct({
    bestScore: D.number,
    entryParticipantType: D.literal('User', 'Team'),
    hasVisibleChildren: D.boolean,
    id: D.string,
    noScore: D.boolean,
    permissions: permissionsDecoder,
    requiresExplicitEntry: D.boolean,
    results: D.array(D.struct({
      attemptAllowsSubmissionsUntil: dateDecoder,
      attemptId: D.string,
      endedAt: D.nullable(dateDecoder),
      latestActivityAt: dateDecoder,
      scoreComputed: D.number,
      startedAt: D.nullable(dateDecoder),
      validated: D.boolean,
    })),
    string: D.struct({
      languageTag: D.string,
      title: D.nullable(D.string),
    }),
    type: D.literal('Chapter','Task','Course','Skill'),
  })
);

const itemNavigationChildDecoder = pipe(
  itemNavigationChildDecoderBase,
  D.intersect(
    D.partial({
      watchedGroup: pipe(
        D.struct({
          canView: D.literal('none','info','content','content_with_descendants','solution'),
        }),
        D.intersect(
          D.partial({
            allValidated: D.boolean,
            avgScore: D.number,
          })
        )
      ),
    })
  )
);

export type ItemNavigationChild = D.TypeOf<typeof itemNavigationChildDecoder>;

const itemNavigationDataDecoder = D.struct({
  id: D.string,
  attemptId: D.string,
  permissions: permissionsDecoder,
  string: D.struct({
    languageTag: D.string,
    title: D.nullable(D.string),
  }),
  type: D.literal('Chapter','Task','Course','Skill'),
  children: D.array(itemNavigationChildDecoder),
});

export type ItemNavigationData = D.TypeOf<typeof itemNavigationDataDecoder>;

const rootActivitiesDecoder = D.array(
  D.struct({
    groupId: D.string,
    name: D.string,
    type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants'),
    activity: itemNavigationChildDecoderBase
  })
);

export type RootActivities = D.TypeOf<typeof rootActivitiesDecoder>;

const rootSkillsDecoder = D.array(
  D.struct({
    groupId: D.string,
    name: D.string,
    type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants'),
    skill: itemNavigationChildDecoderBase
  })
);

export type RootSkills = D.TypeOf<typeof rootSkillsDecoder>;

// common type to RootActivities and RootSkills if the activity/skill key is renamed 'item'
export type RootItems = (Omit<RootActivities[number], 'activity'> & { item: RootActivities[number]['activity']})[];

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService {

  constructor(private http: HttpClient) {}

  getItemNavigation(itemId: string, attemptId: string, skillsOnly = false): Observable<ItemNavigationData> {
    return this.getItemNavigationGeneric(itemId, new HttpParams({ fromObject: { attempt_id: attemptId } }), skillsOnly);
  }

  getItemNavigationFromChildRoute(itemId: string, childRoute: FullItemRoute, skillsOnly = false): Observable<ItemNavigationData> {
    return this.getItemNavigationGeneric(
      itemId,
      new HttpParams({ fromObject:
        isRouteWithSelfAttempt(childRoute) ? { child_attempt_id: childRoute.attemptId } : { attempt_id: childRoute.parentAttemptId }
      }),
      skillsOnly
    );
  }

  private getItemNavigationGeneric(itemId: string, params: HttpParams, skillsOnly = false): Observable<ItemNavigationData> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/navigation`, { params: params }).pipe(
      decodeSnakeCase(itemNavigationDataDecoder),
      map(data => (skillsOnly ? { ...data, children: data.children.filter(c => c.type === 'Skill') } : data))
    );
  }

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
            hasChildren: data.children !== null && data.children.length > 0,
            attemptId: data.attempt_id,
            locked: data.permissions.can_view === 'info',
          },
          items: data.children === null ? [] : data.children.filter(i => !skillsOnly || isASkill(i)).map(i => createNavMenuItem(i)),
        }))
      );
  }

  getRootActivities(watchedGroupId?: string): Observable<RootActivities> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/activities`, { params: httpParams }).pipe(
      decodeSnakeCase(rootActivitiesDecoder),
    );
  }

  getRootSkills(watchedGroupId?: string): Observable<RootSkills> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/skills`, { params: httpParams }).pipe(
      decodeSnakeCase(rootSkillsDecoder),
    );
  }

  getRoots(type: ItemTypeCategory): Observable<RootItems> {
    return isSkill(type) ?
      this.getRootSkills().pipe(map(groups => groups.map(g => ({ ...g, item: g.skill })))) :
      this.getRootActivities().pipe(map(groups => groups.map(g => ({ ...g, item: g.activity }))));
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
