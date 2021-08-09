import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathParamName } from './content-route';
import { isSkill, ItemTypeCategory } from '../helpers/item-type';
import { isString } from '../helpers/type-checkers';
import { UrlCommand, UrlCommandParameters } from '../helpers/url';

// url parameter names
const activityPrefix = 'activities';
const skillPrefix = 'skills';
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';
export const itemRoutePrefixes = [ activityPrefix, skillPrefix ];

// alias for better readibility
type ItemId = string;
type AttemptId = string;

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item without need for fetching a path
 * ********************************************************************************************************** */

interface ItemRouteBase extends ContentRoute {
  contentType: ItemTypeCategory;
}
export type ItemRouteWithAttempt = ItemRouteBase & { attemptId: AttemptId };
export type ItemRouteWithParentAttempt = ItemRouteBase & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

export function isRouteWithAttempt(item: ItemRoute): item is ItemRouteWithAttempt {
  return 'attemptId' in item;
}

/**
 * The route to the app default (see config) item
 */
export function appDefaultItemRoute(cat: ItemTypeCategory = 'activity'): ItemRouteWithParentAttempt {
  return {
    contentType: cat,
    id: isSkill(cat) ? appConfig.defaultSkillId : appConfig.defaultActivityId,
    path: [],
    parentAttemptId: defaultAttemptId,
  };
}


/* **********************************************************************************************************
 * Utility functions for finding the item route from router information
 * ********************************************************************************************************** */

 interface ItemRouteError {
  tag: 'error';
  contentType: ItemTypeCategory;
  id?: ItemId;
  path?: ItemId[];
}

export function itemRouteFromParams(prefix: string, params: ParamMap): ItemRoute|ItemRouteError {
  if (!itemRoutePrefixes.includes(prefix)) throw new Error('Unexpecte item path prefix');
  const cat: ItemTypeCategory = prefix === activityPrefix ? 'activity' : 'skill';
  const id = params.get('id');
  const pathAsString = params.get(pathParamName);
  const attemptId = params.get(attemptParamName);
  const parentAttemptId = params.get(parentAttemptParamName);

  if (!id) return { contentType: cat, tag: 'error', id: undefined }; // null or empty
  if (pathAsString === null) return { contentType: cat, tag: 'error', id: id };
  const path = pathAsString === '' ? [] : pathAsString.split(',');
  if (attemptId) return { contentType: cat, id: id, path: path, attemptId: attemptId }; // not null nor empty
  if (parentAttemptId) return { contentType: cat, id: id, path: path, parentAttemptId: parentAttemptId }; // not null nor empty
  return { contentType: cat, tag: 'error', id: id, path: path };
}

export function isItemRouteError(route: ItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}


/* **********************************************************************************************************
 * Utility functions for converting item info to a navigable url command
 * ********************************************************************************************************** */

/**
 * Url (as string) of the item route without attemptId or path (only item id)
*/
export function urlArrayForRawItem(id: ItemId, cat: ItemTypeCategory, page: string|string[] = 'details'): UrlCommand {
  return urlArrayForItem(id, cat, {}, page);
}

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(route: ItemRoute, page: string|string[] = 'details'): UrlCommand {
  const params: UrlCommandParameters = {};
  if (isRouteWithAttempt(route)) params[attemptParamName] = route.attemptId;
  else params[parentAttemptParamName] = route.parentAttemptId;
  params[pathParamName] = route.path;
  return urlArrayForItem(route.id, route.contentType, params, page);
}

function urlArrayForItem(id: ItemId, cat: ItemTypeCategory, params: UrlCommandParameters, page: string|string[]):
  UrlCommand {
  const prefix = cat === 'activity' ? activityPrefix : skillPrefix;
  const pagePath = isString(page) ? [ page ] : page;
  return [ '/', prefix, 'by-id', id, params, ...pagePath ];
}
