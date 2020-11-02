import { ParamMap } from '@angular/router';

type ItemId = string;
type AttemptId = string;
interface ItemRouteCommon {
  id: ItemId;
  path: ItemId[];
}
type ItemRouteWithAttempt = ItemRouteCommon & { attemptId: AttemptId };
type ItemRouteWithParentAttempt = ItemRouteCommon & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

/* url parameter names */
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';
const pathParamName = 'path';

export function isRouteWithAttempt(item: ItemRoute): item is ItemRouteWithAttempt {
  return 'attemptId' in item;
}

type RouterCommands = (string|{[name: string]: string|string[]})[]

/*
 * Build commands to be used with the `Router.navigate()` function
 */
export function itemUrl(item: ItemRoute, page: 'edit'|'details'): RouterCommands {
  const params: {[k: string]: any} = {};
  if (isRouteWithAttempt(item)) params[attemptParamName] = item.attemptId;
  else params[parentAttemptParamName] = item.parentAttemptId;
  params[pathParamName] = item.path;
  return [ 'items', 'by-id', item.id, params, page ];
}
/*
 * Build commands to be used with the `Router.navigate()` function
 */
export function itemDetailsUrl(item: ItemRoute): RouterCommands {
  return itemUrl(item, 'details');
}

/*
 * Build commands to be used with the `Router.navigate()` function
 */
export function itemEditUrl(item: ItemRoute): RouterCommands {
  return itemUrl(item, 'edit');
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
