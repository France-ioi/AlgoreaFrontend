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
import { permissionsDecoder } from 'src/app/modules/item/helpers/item-permissions';
import { dateDecoder } from 'src/app/shared/helpers/decoders';

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

  getRoots(type: ItemTypeCategory): Observable<RootItem[]> {
    return isSkill(type) ?
      this.getRootSkills().pipe(map(groups => groups.map(g => ({ ...g, item: g.skill })))) :
      this.getRootActivities().pipe(map(groups => groups.map(g => ({ ...g, item: g.activity }))));
  }

}
