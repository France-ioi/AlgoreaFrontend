import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { itemViewPermDecoder } from 'src/app/shared/models/domain/item-view-permission';
import { itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';
import { groupBy } from 'src/app/shared/helpers/array';

const itemNavigationChildDecoderBase = pipe(
  D.struct({
    bestScore: D.number,
    entryParticipantType: D.literal('User', 'Team'),
    hasVisibleChildren: D.boolean,
    id: D.string,
    noScore: D.boolean,
    permissions: itemCorePermDecoder,
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
        itemViewPermDecoder,
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
  permissions: itemCorePermDecoder,
  string: D.struct({
    languageTag: D.string,
    title: D.nullable(D.string),
  }),
  type: D.literal('Chapter','Task','Course','Skill'),
  children: D.array(itemNavigationChildDecoder),
});

export type ItemNavigationData = D.TypeOf<typeof itemNavigationDataDecoder>;

const rootItemGroupInfoDecoder = D.struct({
  groupId: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants'),
});

const rootActivityDecoder = D.intersect(rootItemGroupInfoDecoder)(D.struct({ activity: itemNavigationChildDecoderBase }));
type GroupWithRootActivity = D.TypeOf<typeof rootActivityDecoder>;

const rootSkillDecoder = D.intersect(rootItemGroupInfoDecoder)(D.struct({ skill: itemNavigationChildDecoderBase }));
type GroupWithRootSkill = D.TypeOf<typeof rootSkillDecoder>;

// common type to RootActivity and RootSkill if the activity/skill key is renamed 'item'
export type GroupWithRootItem = Omit<GroupWithRootActivity, 'activity'> & { item: GroupWithRootActivity['activity']};

// see `mapToItemList` for explanation
export type RootItem = D.TypeOf<typeof itemNavigationChildDecoderBase> & { groups: D.TypeOf<typeof rootItemGroupInfoDecoder>[] };

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService {

  constructor(private http: HttpClient) {}

  getItemNavigation(
    itemId: string,
    options: ({ attemptId: string} | { childRoute: FullItemRoute }) & { skillOnly?: boolean, watchedGroupId?: string }
  ): Observable<ItemNavigationData> {

    let params = new HttpParams({ fromObject: options.watchedGroupId ? { watched_group_id: options.watchedGroupId } : {} });
    if ('attemptId' in options) params = params.set('attempt_id', options.attemptId);
    else if (isRouteWithSelfAttempt(options.childRoute)) params = params.set('child_attempt_id', options.childRoute.attemptId);
    else params = params.set('attempt_id', options.childRoute.parentAttemptId);

    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/navigation`, { params: params }).pipe(
      decodeSnakeCase(itemNavigationDataDecoder),
      map(data => (options.skillOnly ? { ...data, children: data.children.filter(c => c.type === 'Skill') } : data))
    );
  }

  getRootActivities(watchedGroupId?: string): Observable<GroupWithRootActivity[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/activities`, { params: httpParams }).pipe(
      decodeSnakeCase(D.array(rootActivityDecoder)),
    );
  }

  getRootSkills(watchedGroupId?: string): Observable<GroupWithRootSkill[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/skills`, { params: httpParams }).pipe(
      decodeSnakeCase(D.array(rootSkillDecoder)),
    );
  }

  getRoots(type: ItemTypeCategory, watchedGroupId?: string): Observable<RootItem[]> {
    const rootAsGroupList$: Observable<GroupWithRootItem[]> = isSkill(type) ?
      this.getRootSkills(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.skill })))) :
      this.getRootActivities(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.activity }))));
    return rootAsGroupList$.pipe(map(groupList => this.mapToItemList(groupList)));
  }

  /**
   * Map a list of groups, each time with their root activity/skill (possibily used several time) to a list of the root activities/skills
   * with a list of the groups which use them as root activity/skill
   */
  private mapToItemList(groups: GroupWithRootItem[]): RootItem[] {
    return Array.from(groupBy(groups, g => g.item.id).values()).map(groupsForItem => ({
      ...groupsForItem[0]!.item,
      groups: groupsForItem,
    }));
  }

}
