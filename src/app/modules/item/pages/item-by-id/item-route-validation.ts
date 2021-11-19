import { ParamMap } from '@angular/router';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { decodeItemRouterParameters, FullItemRoute, itemCategoryFromPrefix } from 'src/app/shared/routing/item-route';

// alias for better readibility
type ItemId = string;

interface ItemRouteError {
  tag: 'error',
  contentType: ItemTypeCategory,
  id?: ItemId,
  path?: ItemId[],
  answerId?: string,
}

export function itemRouteFromParams(prefix: string, params: ParamMap): FullItemRoute|ItemRouteError {
  const cat = itemCategoryFromPrefix(prefix);
  if (cat === null) throw new Error('Unexpected item path prefix');
  const { id, path, attemptId, parentAttemptId, answerId: answerIdOrNull } = decodeItemRouterParameters(params);
  const answerId = answerIdOrNull ?? undefined;

  if (!id) return { contentType: cat, tag: 'error', id: undefined, answerId }; // null or empty
  if (path === null) return { contentType: cat, tag: 'error', id, answerId };
  const pathList = path === '' ? [] : path.split(',');
  if (attemptId) return { contentType: cat, id: id, path: pathList, attemptId, answerId }; // not null nor empty
  if (parentAttemptId) return { contentType: cat, id: id, path: pathList, parentAttemptId, answerId }; // not null nor empty
  return { contentType: cat, tag: 'error', id: id, path: pathList, answerId };
}

export function isItemRouteError(route: FullItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}
