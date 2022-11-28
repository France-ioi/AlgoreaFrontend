import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';
import { ItemTypeCategory } from '../helpers/item-type';
import { isString } from '../helpers/type-checkers';
import { UrlCommand } from '../helpers/url';

// url parameter names
const activityPrefix = 'activities';
const skillPrefix = 'skills';
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';
const answerParamName = 'answerId';

// alias for better readibility
type ItemId = string;
type AttemptId = string;
type AnswerId = string;

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item without need for fetching a path
 * ********************************************************************************************************** */

// FullItemRoute contains all required info (path and (self or parent) attempt) so that no more queries are required after navigation
// ItemRoute may miss the (self and parent) attempt, will require fetching results to determine attempt after navigation.
// RawItemRoute may miss path and attempt, will required fetching the path and attempts after navigation.
//
// When navigating, as many information as possible should be given to the item router so that the navigation is not slowed down.
// So always prefer usage of FullItemRoute over ItemRoute over RawItemRoute.
export interface ItemRoute extends ContentRoute {
  contentType: ItemTypeCategory,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answerId?: AnswerId,
}
type ItemRouteWithSelfAttempt = ItemRoute & { attemptId: AttemptId };
type ItemRouteWithParentAttempt = ItemRoute & { parentAttemptId: AttemptId };
export type FullItemRoute = ItemRouteWithSelfAttempt | ItemRouteWithParentAttempt;
export type RawItemRoute = Omit<ItemRoute, 'path'> & Partial<Pick<ItemRoute, 'path'>>;

export function isItemRoute(route: ContentRoute): route is ItemRoute {
  return ([ 'activity', 'skill' ].includes(route.contentType));
}

export function isFullItemRoute(route: ItemRoute): route is FullItemRoute {
  return !!route.attemptId || !!route.parentAttemptId;
}

export function isRouteWithSelfAttempt(item: FullItemRoute): item is ItemRouteWithSelfAttempt {
  return item.attemptId !== undefined;
}

export function rawItemRoute(contentType: ItemTypeCategory, id: ItemId, answerId?: AnswerId): RawItemRoute {
  return { contentType, id, answerId };
}
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, path: string[]): ItemRoute {
  return { ...rawItemRoute(contentType, id), path };
}

type RequiredAttempt = { attemptId: AttemptId } | { parentAttemptId: AttemptId };
export function fullItemRoute(contentType: ItemTypeCategory, id: ItemId, path: string[], attempt: RequiredAttempt): FullItemRoute {
  return { ...itemRoute(contentType, id, path), ...attempt };
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
export const appDefaultItemRoute: FullItemRoute = {
  contentType: 'activity',
  id: appConfig.defaultActivityId,
  path: [],
  parentAttemptId: defaultAttemptId,
};


/* **********************************************************************************************************
 * Utility functions for decoding the item route
 * ********************************************************************************************************** */
export function decodeItemRouterParameters(params: ParamMap): {
  id: string|null,
  path: string|null,
  attemptId: string|null,
  parentAttemptId: string|null,
  answerId: string|null,
} {
  return {
    id: params.get('id'),
    path: pathFromRouterParameters(params),
    attemptId: params.get(attemptParamName),
    parentAttemptId: params.get(parentAttemptParamName),
    answerId: params.get(answerParamName),
  };
}

export function itemCategoryFromPrefix(prefix: string): ItemTypeCategory|null {
  switch (prefix) {
    case activityPrefix: return 'activity';
    case skillPrefix: return 'skill';
    default: return null;
  }
}

/* **********************************************************************************************************
 * Utility functions for converting item info to a navigable url command
 * ********************************************************************************************************** */

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(route: RawItemRoute, page: string|string[] = []): UrlCommand {
  const params = route.path ? pathAsParameter(route.path) : {};
  if (route.attemptId) params[attemptParamName] = route.attemptId;
  else if (route.parentAttemptId) params[parentAttemptParamName] = route.parentAttemptId;
  if (route.answerId) params[answerParamName] = route.answerId;

  const prefix = route.contentType === 'activity' ? activityPrefix : skillPrefix;
  const pagePath = isString(page) ? [ page ] : page;
  return [ '/', prefix, 'by-id', route.id, params, ...pagePath ];
}
