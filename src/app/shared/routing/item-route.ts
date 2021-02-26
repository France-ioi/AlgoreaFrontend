import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathParamName } from './content-route';
import { isSkill, ItemTypeCategory } from '../helpers/item-type';

// url parameter names
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';

// alias for better readibility
type ItemId = string;
type AttemptId = string;

export type ItemRouteWithAttempt = ContentRoute & { attemptId: AttemptId };
export type ItemRouteWithParentAttempt = ContentRoute & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

export function isRouteWithAttempt(item: ItemRoute): item is ItemRouteWithAttempt {
  return 'attemptId' in item;
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
 * Url (as string) of the item route without attemptId or path (only item id)
*/
export function incompleteItemStringUrl(id: ItemId): string {
  return `/items/by-id/${id}/details`;
}

/**
 * Url (as string) of the details page for the given item route
 */
export function urlStringForItemRoute(item: ItemRoute, page: 'edit'|'details' = 'details'): string {
  const attemptPart = isRouteWithAttempt(item) ?
    `${attemptParamName}=${item.attemptId}` :
    `${parentAttemptParamName}=${item.parentAttemptId}`;
  return `/items/by-id/${item.id};${attemptPart};${pathParamName}=${item.path.join(',')}/${page}`;
}

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(item: ItemRoute, page: 'edit'|'details' = 'details'): any[] {
  const params: {[k: string]: any} = {};
  if (isRouteWithAttempt(item)) params[attemptParamName] = item.attemptId;
  else params[parentAttemptParamName] = item.parentAttemptId;
  params[pathParamName] = item.path;
  return [ '/', 'items', 'by-id', item.id, params, page ];
}

interface ItemRouteError {
  tag: 'error';
  id?: ItemId;
  path?: ItemId[];
}

export function itemRouteFromParams(params: ParamMap): ItemRoute|ItemRouteError {
  const id = params.get('id');
  const pathAsString = params.get(pathParamName);
  const attemptId = params.get(attemptParamName);
  const parentAttemptId = params.get(parentAttemptParamName);

  if (!id) return { tag: 'error', id: undefined }; // null or empty
  if (pathAsString === null) return { tag: 'error', id: id };
  const path = pathAsString === '' ? [] : pathAsString.split(',');
  if (attemptId) return { id: id, path: path, attemptId: attemptId }; // not null nor empty
  if (parentAttemptId) return { id: id, path: path, parentAttemptId: parentAttemptId }; // not null nor empty
  return { tag: 'error', id: id, path: path };
}

export function isItemRouteError(route: ItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}
