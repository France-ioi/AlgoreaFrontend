import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathParamName } from './content-route';
import { isSkill, ItemTypeCategory } from '../helpers/item-type';

// url parameter names
const activityPrefix = 'activities';
const skillPrefix = 'skills';
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';

// alias for better readibility
type ItemId = string;
type AttemptId = string;

interface ItemRouteBase extends ContentRoute {
  contentType: ItemTypeCategory;
}
export type ItemRouteWithAttempt = ItemRouteBase & { attemptId: AttemptId };
export type ItemRouteWithParentAttempt = ItemRouteBase & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

export function isRouteWithAttempt(item: ItemRoute): item is ItemRouteWithAttempt {
  return 'attemptId' in item;
}

export const itemRoutePrefixes = [ activityPrefix, skillPrefix ];

/**
 * The route to the app default (see config) item
 */
export function appDefaultItemRoute(cat: ItemTypeCategory = 'activity'): ItemRouteWithParentAttempt {
  return {
    contentType: 'activity',
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
export function urlStringForItemRoute(route: ItemRoute, page: 'edit'|'details' = 'details'): string {
  const attemptPart = isRouteWithAttempt(route) ?
    `${attemptParamName}=${route.attemptId}` :
    `${parentAttemptParamName}=${route.parentAttemptId}`;
  return `/${itemTypeCategoryPrefix(route.contentType)}/by-id/${route.id};${attemptPart};${pathParamName}=${route.path.join(',')}/${page}`;
}

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(route: ItemRoute, page: 'edit'|'details' = 'details'): any[] {
  const params: {[k: string]: any} = {};
  if (isRouteWithAttempt(route)) params[attemptParamName] = route.attemptId;
  else params[parentAttemptParamName] = route.parentAttemptId;
  params[pathParamName] = route.path;
  return [ '/', itemTypeCategoryPrefix(route.contentType), 'by-id', route.id, params, page ];
}

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

function itemTypeCategoryPrefix(cat: ItemTypeCategory): string {
  return cat === 'activity' ? activityPrefix : skillPrefix;
}
