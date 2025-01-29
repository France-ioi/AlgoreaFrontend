import { defaultAttemptId } from '../../items/models/attempts';
import { appConfig } from '../../utils/config';
import { ContentRoute } from './content-route';
import { ItemTypeCategory } from '../../items/models/item-type';
import { AnswerId, AttemptId, ItemId, ItemPath, ParticipantId } from '../ids';

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item
 *
 * It exists in 3 formats depending on how fully-defined it is:
 * - `FullItemRoute` contains all required info (path and (self or parent) attempt) so that no more queries are required after navigation
 * - `ItemRoute` may miss the (self and parent) attempt, will require fetching results to determine attempt after navigation
 * - `RawItemRoute` may miss path and attempt (will require fetching the path and attempts after navigation). Is not a `ContentRoute`
 *
 * When navigating, as many information as possible should be given to the item router so that the navigation is not slowed down.
 * So always prefer building a `FullItemRoute` over a `ItemRoute` over a `RawItemRoute` (if you have the info)
 * ********************************************************************************************************** */

// STRUCTURES
export interface ItemRoute extends ContentRoute {
  contentType: ItemTypeCategory,
  id: ItemId,
  path: ItemPath,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answer?: { id: AnswerId, best?: undefined } | { best: { id?: ParticipantId /* not set -> mine */ }, id?: undefined },
}
export type FullItemRoute = ItemRoute & (Required<Pick<ItemRoute, 'attemptId'>> | Required<Pick<ItemRoute, 'parentAttemptId'>>);
export type RawItemRoute = Omit<ItemRoute, 'path'> & Partial<Pick<ItemRoute, 'path'>>;

// TYPE ASSERT FUNCTIONS
export function isItemRoute(route: ContentRoute): route is ItemRoute {
  return ([ 'activity', 'skill' ].includes(route.contentType));
}

export function isFullItemRoute(route: ContentRoute): route is FullItemRoute {
  return isItemRoute(route) && (!!route.attemptId || !!route.parentAttemptId);
}

export function isRouteWithSelfAttempt(item: FullItemRoute): item is ItemRoute & Required<Pick<ItemRoute, 'attemptId'>> {
  return item.attemptId !== undefined;
}

// FACTORIES
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs: Omit<FullItemRoute, 'contentType'|'id'>): FullItemRoute;
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs: Omit<ItemRoute, 'contentType'|'id'>): ItemRoute;
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs?: Omit<RawItemRoute, 'contentType'|'id'>): RawItemRoute;

export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs?: Omit<RawItemRoute, 'contentType'|'id'>): RawItemRoute {
  return { ...attrs, contentType, id };
}

/**
 * Add to the given route, the given self attempt id (if any) (used when only the parent id was know until now)
 */
export function routeWithSelfAttempt(route: FullItemRoute, attemptId: string|undefined): FullItemRoute {
  return isRouteWithSelfAttempt(route) ? route : { ...route, attemptId };
}

/**
 * The route to the app default (see config) item
 */
export const appDefaultActivityRoute = itemRoute('activity', appConfig.defaultActivityId, { path: [], parentAttemptId: defaultAttemptId });
export const appDefaultSkillRoute = appConfig.defaultSkillId ?
  itemRoute('skill', appConfig.defaultSkillId, { path: [], parentAttemptId: defaultAttemptId }) :
  undefined;

/**
 * Return the route of the parent item of the given item route.
 * Beware it assumes the parent as the same content type as its child... which is not fully guaranteed
 */
export function parentRoute(route: ItemRoute): ItemRoute {
  if (route.path.length === 0) return appDefaultActivityRoute;
  return itemRoute(route.contentType, route.path[route.path.length - 1]!, {
    attemptId: route.parentAttemptId ?? undefined,
    path: route.path.slice(0, -1),
  });
}
