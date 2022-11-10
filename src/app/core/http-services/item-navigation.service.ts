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

const rootActivityDecoder = D.struct({
  groupId: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants'),
  activity: itemNavigationChildDecoderBase
});

export type RootActivity = D.TypeOf<typeof rootActivityDecoder>;

const rootSkillDecoder = D.struct({
  groupId: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants'),
  skill: itemNavigationChildDecoderBase
});

export type RootSkill = D.TypeOf<typeof rootSkillDecoder>;

// common type to RootActivity and RootSkill if the activity/skill key is renamed 'item'
export type RootItem = Omit<RootActivity, 'activity'> & { item: RootActivity['activity']};

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

  getRootActivities(watchedGroupId?: string): Observable<RootActivity[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/activities`, { params: httpParams }).pipe(
      decodeSnakeCase(D.array(rootActivityDecoder)),
    );
  }

  getRootSkills(watchedGroupId?: string): Observable<RootSkill[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${appConfig.apiUrl}/current-user/group-memberships/skills`, { params: httpParams }).pipe(
      decodeSnakeCase(D.array(rootSkillDecoder)),
    );
  }

  getRoots(type: ItemTypeCategory, watchedGroupId?: string): Observable<RootItem[]> {
    return isSkill(type) ?
      this.getRootSkills(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.skill })))) :
      this.getRootActivities(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.activity }))));
  }

}
