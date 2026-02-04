import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { ItemTypeCategory, itemTypeCategoryEnum, itemTypeSchema } from 'src/app/items/models/item-type';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { itemViewPermSchema } from 'src/app/items/models/item-view-permission';
import { itemCorePermSchema } from 'src/app/items/models/item-permissions';
import { groupBy } from 'src/app/utils/array';
import { z } from 'zod';
import { MINUTES } from '../utils/duration';
import { Cacheable } from 'ts-cacheable';
import { Subject } from 'rxjs';
import { CurrentContentService } from '../services/current-content.service';
import { IObservableCacheConfig } from 'ts-cacheable/dist/cjs/common/IObservableCacheConfig';

const cacheBuster$ = new Subject<void>();
const cacheConfig: IObservableCacheConfig = { maxAge: 2*MINUTES, maxCacheCount: 5, cacheBusterObserver: cacheBuster$ };

const itemNavigationChildBaseSchema = z.object({
  id: z.string(),
  bestScore: z.number(),
  entryParticipantType: z.enum([ 'User', 'Team' ]),
  hasVisibleChildren: z.boolean(),
  noScore: z.boolean(),
  permissions: itemCorePermSchema,
  requiresExplicitEntry: z.boolean(),
  results: z.array(z.object({
    attemptAllowsSubmissionsUntil: z.coerce.date(),
    attemptId: z.string(),
    endedAt: z.coerce.date().nullable(),
    latestActivityAt: z.coerce.date(),
    scoreComputed: z.number(),
    startedAt: z.coerce.date().nullable(),
    validated: z.boolean(),
  })),
  string: z.object({
    languageTag: z.string(),
    title: z.string().nullable(),
  }),
  type: itemTypeSchema,
});

const itemNavigationChildSchema = itemNavigationChildBaseSchema.and(z.object({
  watchedGroup: itemViewPermSchema.and(z.object({
    allValidated: z.boolean(),
    avgScore: z.number(),
  }).partial()),
}).partial());

export type ItemNavigationChild = z.infer<typeof itemNavigationChildSchema>;

const itemNavigationDataSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  permissions: itemCorePermSchema,
  string: z.object({
    languageTag: z.string(),
    title: z.string().nullable(),
  }),
  type: z.enum([ 'Chapter', 'Task', 'Skill' ]),
  children: z.array(itemNavigationChildSchema),
});

export type ItemNavigationData = z.infer<typeof itemNavigationDataSchema>;

const rootItemGroupInfoSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base', 'ContestParticipants' ]),
});

const rootActivitySchema = rootItemGroupInfoSchema.and(z.object({
  activity: itemNavigationChildBaseSchema,
}));
type GroupWithRootActivity = z.infer<typeof rootActivitySchema>;

const rootSkillSchema = rootItemGroupInfoSchema.and(z.object({
  skill: itemNavigationChildBaseSchema
}));
type GroupWithRootSkill = z.infer<typeof rootSkillSchema>;

// common type to RootActivity and RootSkill if the activity/skill key is renamed 'item'
export type GroupWithRootItem = Omit<GroupWithRootActivity, 'activity'> & { item: GroupWithRootActivity['activity']};

// see `mapToItemList` for explanation
export type RootItem = z.infer<typeof itemNavigationChildBaseSchema> & { groups: z.infer<typeof rootItemGroupInfoSchema>[] };

@Injectable({
  providedIn: 'root'
})
export class ItemNavigationService implements OnDestroy {
  private http = inject(HttpClient);
  private currentContent = inject(CurrentContentService);
  private config = inject(APPCONFIG);

  private subscription = this.currentContent.navMenuReload$.subscribe(() => cacheBuster$.next());

  @Cacheable(cacheConfig)
  getItemNavigation(
    itemId: string,
    options: ({ attemptId: string} | { childRoute: FullItemRoute }) & { skillOnly?: boolean, watchedGroupId?: string }
  ): Observable<ItemNavigationData> {

    let params = new HttpParams({ fromObject: options.watchedGroupId ? { watched_group_id: options.watchedGroupId } : {} });
    if ('attemptId' in options) params = params.set('attempt_id', options.attemptId);
    else if (isRouteWithSelfAttempt(options.childRoute)) params = params.set('child_attempt_id', options.childRoute.attemptId);
    else params = params.set('attempt_id', options.childRoute.parentAttemptId);

    return this.http.get<unknown>(`${this.config.apiUrl}/items/${itemId}/navigation`, { params: params }).pipe(
      decodeSnakeCase(itemNavigationDataSchema),
      map(data => (options.skillOnly ? { ...data, children: data.children.filter(c => c.type === 'Skill') } : data))
    );
  }

  @Cacheable(cacheConfig)
  getRootActivities(watchedGroupId?: string): Observable<GroupWithRootActivity[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${this.config.apiUrl}/current-user/group-memberships/activities`, { params: httpParams }).pipe(
      decodeSnakeCase(z.array(rootActivitySchema)),
    );
  }

  @Cacheable(cacheConfig)
  getRootSkills(watchedGroupId?: string): Observable<GroupWithRootSkill[]> {
    let httpParams = new HttpParams();

    if (watchedGroupId) {
      httpParams = httpParams.set('watched_group_id', watchedGroupId);
    }

    return this.http.get<unknown[]>(`${this.config.apiUrl}/current-user/group-memberships/skills`, { params: httpParams }).pipe(
      decodeSnakeCase(z.array(rootSkillSchema)),
    );
  }

  getRoots(type: ItemTypeCategory, watchedGroupId?: string): Observable<RootItem[]> {
    const rootAsGroupList$: Observable<GroupWithRootItem[]> = type === itemTypeCategoryEnum.skill ?
      this.getRootSkills(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.skill })))) :
      this.getRootActivities(watchedGroupId).pipe(map(groups => groups.map(g => ({ ...g, item: g.activity }))));
    return rootAsGroupList$.pipe(map(groupList => this.mapToItemList(groupList)));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
