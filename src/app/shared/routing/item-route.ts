import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';
import { ItemTypeCategory } from '../helpers/item-type';
import { isString } from '../helpers/type-checkers';
import { UrlCommand, UrlCommandParameters } from '../helpers/url';

// url parameter names
const activityPrefix = 'activities';
const skillPrefix = 'skills';
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';

// alias for better readibility
type ItemId = string;
type AttemptId = string;

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item without need for fetching a path
 * ********************************************************************************************************** */

export interface ItemRoute extends ContentRoute {
  contentType: ItemTypeCategory;
  attemptId?: AttemptId;
  parentAttemptId?: AttemptId;
}
type ItemRouteWithSelfAttempt = ItemRoute & { attemptId: AttemptId };
type ItemRouteWithParentAttempt = ItemRoute & { parentAttemptId: AttemptId };
export type FullItemRoute = ItemRouteWithSelfAttempt | ItemRouteWithParentAttempt;

export function isRouteWithSelfAttempt(item: FullItemRoute): item is ItemRouteWithSelfAttempt {
  return 'attemptId' in item;
}

/**
 * The route to the app default (see config) item
 */
export function appDefaultItemRoute(): FullItemRoute {
  return {
    contentType: 'activity',
    id: appConfig.defaultActivityId,
    path: [],
    parentAttemptId: defaultAttemptId,
  };
}


/* **********************************************************************************************************
 * Utility functions for decoding the item route
 * ********************************************************************************************************** */
export function decodeItemRouterParameters(params: ParamMap): {
  id: string|null,
  path: string|null,
  attemptId: string|null,
  parentAttemptId: string|null
} {
  return {
    id: params.get('id'),
    path: pathFromRouterParameters(params),
    attemptId: params.get(attemptParamName),
    parentAttemptId: params.get(parentAttemptParamName)
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
 * Url (as string) of the item route without attemptId or path (only item id)
 * `urlArrayForItemRoute` should always be preferred to this one, using raw item means further requests will be required to fetch
 * path and attempt information
*/
export function urlArrayForRawItem(id: ItemId, cat: ItemTypeCategory, page: string|string[] = 'details'): UrlCommand {
  return urlArrayForItem(id, cat, {}, page);
}

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(route: FullItemRoute, page: string|string[] = 'details'): UrlCommand {
  const params = pathAsParameter(route.path);
  if (isRouteWithSelfAttempt(route)) params[attemptParamName] = route.attemptId;
  else params[parentAttemptParamName] = route.parentAttemptId;
  return urlArrayForItem(route.id, route.contentType, params, page);
}

function urlArrayForItem(id: ItemId, cat: ItemTypeCategory, params: UrlCommandParameters, page: string|string[]):
  UrlCommand {
  const prefix = cat === 'activity' ? activityPrefix : skillPrefix;
  const pagePath = isString(page) ? [ page ] : page;
  return [ '/', prefix, 'by-id', id, params, ...pagePath ];
}
