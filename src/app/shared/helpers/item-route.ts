import { ParamMap, Router, UrlTree } from '@angular/router';
import { defaultAttemptId } from './attempts';
import { appConfig } from './config';
import { isSkill, ItemTypeCategory } from './item-type';

type ItemId = string;
type AttemptId = string;
interface ItemRouteCommon {
  id: ItemId;
  path: ItemId[];
}
export type ItemRouteWithAttempt = ItemRouteCommon & { attemptId: AttemptId };
export type ItemRouteWithParentAttempt = ItemRouteCommon & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

/* url parameter names */
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';
const pathParamName = 'path';

export function isRouteWithAttempt(item: ItemRoute): item is ItemRouteWithAttempt {
  return 'attemptId' in item;
}

/**
 * Build, from an item route, an url for navigation
 */
export function itemUrl(router: Router, item: ItemRoute, page: 'edit'|'details'): UrlTree {
  const params: {[k: string]: any} = {};
  if (isRouteWithAttempt(item)) params[attemptParamName] = item.attemptId;
  else params[parentAttemptParamName] = item.parentAttemptId;
  params[pathParamName] = item.path;
  return router.createUrlTree([ 'items', 'by-id', item.id, params, page ]);
}

/**
 * The route to the app default (see config) item
 */
export function appDefaultItemRoute(cat: ItemTypeCategory = 'activity'): ItemRouteWithParentAttempt {
  return {
    id: isSkill(cat) ? appConfig().defaultSkillId : appConfig().defaultActivityId,
    path: [],
    parentAttemptId: defaultAttemptId,
  };
}

/**
 * Build an url to an item with missing path and attempt
 */
export function incompleteItemUrl(router: Router, itemId: string): UrlTree {
  return router.createUrlTree([ 'items', 'by-id', itemId ]);
}

/**
 * Url (as string) of the details page for the given item route
 */
export function itemStringUrl(item: ItemRoute): string {
  const attemptPart = isRouteWithAttempt(item) ?
    `${attemptParamName}=${item.attemptId}` :
    `${parentAttemptParamName}=${item.parentAttemptId}`;

  return `/items/by-id/${item.id};${attemptPart};${pathParamName}=${item.path.join(',')}/details`;
}

export function itemDetailsUrl(router: Router, item: ItemRoute): UrlTree {
  return itemUrl(router, item, 'details');
}

export function itemEditUrl(router: Router, item: ItemRoute): UrlTree {
  return itemUrl(router, item, 'edit');
}

export interface ItemRouteError {
  tag: 'error';
  id?: ItemId;
  path?: ItemId[];
}

export function itemRouteFromParams(params: ParamMap): ItemRoute|ItemRouteError {
  const id = params.get('id');
  const pathAsString = params.get(pathParamName);
  const attemptId = params.get(attemptParamName);
  const parentAttemptId = params.get(parentAttemptParamName);

  if (id === null) return { tag: 'error', id: undefined };
  if (pathAsString === null) return { tag: 'error', id: id };
  const path = pathAsString === '' ? [] : pathAsString.split(',');
  if (attemptId !== null) return { id: id, path: path, attemptId: attemptId };
  if (parentAttemptId !== null) return { id: id, path: path, parentAttemptId: parentAttemptId };
  return { tag: 'error', id: id, path: path };
}

export function isItemRouteError(resp: ItemRoute|ItemRouteError): resp is ItemRouteError {
  return 'tag' in resp && resp.tag === 'error';
}
