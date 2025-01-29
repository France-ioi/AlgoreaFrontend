import { UrlSegment } from '@angular/router';
import { FullItemRoute, itemRoute, ItemRoute, RawItemRoute } from './item-route';
import { UrlCommand } from 'src/app/utils/url';
import { ItemTypeCategory, itemTypeCategoryEnum } from 'src/app/items/models/item-type';
import { encodeItemRouteParameters, extractItemRouteParameters } from './item-route-parameters';
import { isAnItemAlias, itemAliasFor, resolveItemAlias } from './item-route-aliasing';

export const activityPrefix = 'a';
export const skillPrefix = 's';

// **********************************************************************************************************
// Create route from url
// **********************************************************************************************************

export type ItemRouteError = { tag: 'error' } & Pick<ItemRoute, 'id'|'contentType'> & Partial<ItemRoute>;
export function isItemRouteError(route: FullItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}

export function parseItemUrlSegments(segments: UrlSegment[]): { route: FullItemRoute|ItemRouteError, page: string[] }|null {
  const [ prefixSegment, mainSegment, ...pageSegments ] = segments;
  if (!prefixSegment || !mainSegment) return null;
  const page = pageSegments.map(segm => segm.path);

  // parsing item category
  const contentType = itemCategoryFromPrefix(prefixSegment.path);
  if (!contentType) return null;

  // parsing id
  const aliasOrId = mainSegment.path;
  const idPath = isAnItemAlias(aliasOrId) ? resolveItemAlias(aliasOrId) : { id: aliasOrId };
  if (!idPath) return null; // the alias does not resolve to an id
  const id = idPath.id;

  // parsing parameters
  const { path: pathFromParam, attemptId, parentAttemptId, answer } = extractItemRouteParameters(mainSegment.parameters);
  const path = pathFromParam ?? idPath.path;

  // creating the response from what we parsed
  if (!path) return { route: { tag: 'error', contentType, id, answer }, page };
  if (attemptId) return { route: itemRoute(contentType, id, { path, attemptId, answer }), page };
  if (parentAttemptId) return { route: itemRoute(contentType, id, { path, parentAttemptId, answer }), page };
  return { route: { tag: 'error', contentType, id, path, answer }, page };
}

export function itemCategoryFromPrefix(prefix: string): ItemTypeCategory|null {
  switch (prefix) {
    case activityPrefix: return itemTypeCategoryEnum.activity;
    case skillPrefix: return itemTypeCategoryEnum.skill;
    default: return null;
  }
}

// **********************************************************************************************************
// Export route for navigation
// **********************************************************************************************************

/**
 * Create a navigable url command based on the given route. If the page is not given, use the root page of the item.
 */
export function itemRouteAsUrlCommand(route: RawItemRoute, page?: string[]): UrlCommand {
  const aliasSearch = itemAliasFor(route.id, route.path);
  const idOrAlias = aliasSearch ? aliasSearch.alias : route.id;
  const parameters = aliasSearch?.hasPath ? { ...route, path: undefined }: route; // if the alias include a path, do not include it in url

  return [
    '/',
    route.contentType === itemTypeCategoryEnum.activity ? activityPrefix : skillPrefix,
    idOrAlias, encodeItemRouteParameters(parameters),
    ...(page ?? []),
  ];
}
