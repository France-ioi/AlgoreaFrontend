import { ParamMap } from '@angular/router';
import { defaultAttemptId } from './attempts';
import { appConfig } from './config';
import { ContentRoute, pathParamName } from './content-route';
import { isSkill, ItemTypeCategory } from './item-type';

type ItemId = string;
type AttemptId = string;

export type ItemRouteWithAttempt = ContentRoute & { attemptId: AttemptId };
export type ItemRouteWithParentAttempt = ContentRoute & { parentAttemptId: AttemptId };
export type ItemRoute = ItemRouteWithAttempt | ItemRouteWithParentAttempt;

/* url parameter names */
export const parentAttemptParamName = 'parentAttempId';
export const attemptParamName = 'attempId';

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
export function itemStringUrl(item: ItemRoute): string {
  const attemptPart = isRouteWithAttempt(item) ?
    `${attemptParamName}=${item.attemptId}` :
    `${parentAttemptParamName}=${item.parentAttemptId}`;

  return `/items/by-id/${item.id};${attemptPart};${pathParamName}=${item.path.join(',')}/details`;
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

  if (!id) return { tag: 'error', id: undefined }; // null or empty
  if (pathAsString === null) return { tag: 'error', id: id };
  const path = pathAsString === '' ? [] : pathAsString.split(',');
  if (attemptId) return { id: id, path: path, attemptId: attemptId }; // not null nor empty
  if (parentAttemptId) return { id: id, path: path, parentAttemptId: parentAttemptId }; // not null nor empty
  return { tag: 'error', id: id, path: path };
}

export function isItemRouteError(resp: ItemRoute|ItemRouteError): resp is ItemRouteError {
  return 'tag' in resp && resp.tag === 'error';
}
