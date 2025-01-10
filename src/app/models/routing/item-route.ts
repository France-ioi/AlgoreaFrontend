import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../../items/models/attempts';
import { appConfig } from '../../utils/config';
import { ContentRoute } from './content-route';
import { ItemTypeCategory } from '../../items/models/item-type';
import { isString } from '../../utils/type-checkers';
import { UrlCommand } from '../../utils/url';
import { arraysEqual } from '../../utils/array';
import { AnswerId, AttemptId, ItemId, ItemPath } from '../ids';
import { pathAsParameter, pathFromRouterParameters } from './path-parameter';

// url parameter names
export const activityPrefix = 'a';
export const skillPrefix = 's';
const parentAttemptParamName = 'pa';
const attemptParamName = 'a';
const answerParamName = 'answerId';
const answerBestParamName = 'answerBest';
const answerBestParticipantParamName = 'answerParticipantId';

// alias for better readibility

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item
 *
 * It exists in 3 formats depending on how fully-defined it is:
 * - `FullItemRoute` contains all required info (path and (self or parent) attempt) so that no more queries are required after navigation
 * - `ItemRoute` may miss the (self and parent) attempt, will require fetching results to determine attempt after navigation
 * - `RawItemRoute` may miss path and attempt (will require fetching the path and attempts after navigation). Is not a `ContentRoute`
 *
 * When navigating, as many information as possible should be given to the item router so that the navigation is not slowed down.
 * So always prefer building a `FullItemRoute` over a `ItemRoute` over a `RawItemRoute` (if you have the info)
 * ********************************************************************************************************** */

// STRUCTURES
export interface ItemRoute extends ContentRoute {
  contentType: ItemTypeCategory,
  id: ItemId,
  path: ItemPath,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answer?:
    { best?: undefined, id: AnswerId, participantId?: undefined } |
    { best: true, id?: undefined, participantId?: string /* not set if mine */ },
}
export type FullItemRoute = ItemRoute & (Required<Pick<ItemRoute, 'attemptId'>> | Required<Pick<ItemRoute, 'parentAttemptId'>>);
export type RawItemRoute = Omit<ItemRoute, 'path'> & Partial<Pick<ItemRoute, 'path'>>;

// TYPE ASSERT FUNCTIONS
export function isItemRoute(route: ContentRoute): route is ItemRoute {
  return ([ 'activity', 'skill' ].includes(route.contentType));
}

export function isFullItemRoute(route: ContentRoute): route is FullItemRoute {
  return isItemRoute(route) && (!!route.attemptId || !!route.parentAttemptId);
}

export function isRouteWithSelfAttempt(item: FullItemRoute): item is ItemRoute & Required<Pick<ItemRoute, 'attemptId'>> {
  return item.attemptId !== undefined;
}

// FACTORIES
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs: Omit<FullItemRoute, 'contentType'|'id'>): FullItemRoute;
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs: Omit<ItemRoute, 'contentType'|'id'>): ItemRoute;
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs?: Omit<RawItemRoute, 'contentType'|'id'>): RawItemRoute;

export function itemRoute(contentType: ItemTypeCategory, id: ItemId, attrs?: Omit<RawItemRoute, 'contentType'|'id'>): RawItemRoute {
  return { ...attrs, contentType, id };
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
export const appDefaultActivityRoute = itemRoute('activity', appConfig.defaultActivityId, { path: [], parentAttemptId: defaultAttemptId });
export const appDefaultSkillRoute = appConfig.defaultSkillId ?
  itemRoute('skill', appConfig.defaultSkillId, { path: [], parentAttemptId: defaultAttemptId }) :
  undefined;

/**
 * Return the route of the parent item of the given item route.
 * Beware it assumes the parent as the same content type as its child... which is not fully guaranteed
 */
export function parentRoute(route: ItemRoute): ItemRoute {
  if (route.path.length === 0) return appDefaultActivityRoute;
  return itemRoute(route.contentType, route.path[route.path.length - 1]!, {
    attemptId: route.parentAttemptId ?? undefined,
    path: route.path.slice(0, -1),
  });
}

/* **********************************************************************************************************
 * Utility functions for decoding the item route from url params
 * ********************************************************************************************************** */
export function decodeItemRouterParameters(params: ParamMap): {
  id: string|null,
  path: string[]|null,
  attemptId: string|null,
  parentAttemptId: string|null,
  answerId: string|null,
  answerBest: boolean,
  answerParticipantId: string|null,
} {
  let idOrAlias = params.get('idOrAlias');
  let path = pathFromRouterParameters(params);
  if (idOrAlias !== null && isAnAlias(idOrAlias)) {
    const res = aliasToId(idOrAlias);
    if (res?.id) idOrAlias = res?.id;
    if (res?.path && !path) path = res.path;
  }
  return {
    id: idOrAlias,
    path,
    attemptId: params.get(attemptParamName),
    parentAttemptId: params.get(parentAttemptParamName),
    answerId: params.get(answerParamName),
    answerBest: params.get(answerBestParamName) === '1',
    answerParticipantId: params.get(answerBestParticipantParamName),
  };
}

export function itemCategoryFromPrefix(prefix: string): ItemTypeCategory|null {
  switch (prefix) {
    case activityPrefix: return 'activity';
    case skillPrefix: return 'skill';
    default: return null;
  }
}

function isAnAlias(idOrAlias: string): boolean {
  return !(/^\d*$/.test(idOrAlias));
}

/**
 * Iterate all alias to map to id. Could be optimized with a cache for better performance
 */
function aliasToId(alias: string): { id: ItemId, path?: string[] } | null {
  const redirects = appConfig.redirects;
  if (!redirects) return null;
  for (const [ k, v ] of Object.entries(redirects)) {
    if (pathToAlias(k) === alias) return v;
  }
  return null;
}

/* **********************************************************************************************************
 * Utility functions for converting item info to a navigable url command
 * ********************************************************************************************************** */

/**
 * Return a url array (`commands` array) to the given item, on the given page.
 */
export function urlArrayForItemRoute(route: RawItemRoute, page: string|string[] = []): UrlCommand {
  const itemAlias = aliasFor(route.id, route.path);
  const params = route.path && !itemAlias?.validPath ? pathAsParameter(route.path) : {};
  if (route.attemptId) params[attemptParamName] = route.attemptId;
  else if (route.parentAttemptId) params[parentAttemptParamName] = route.parentAttemptId;
  if (route.answer) {
    if (route.answer.best) {
      params[answerBestParamName] = '1';
      if (route.answer.participantId) params[answerBestParticipantParamName] = route.answer.participantId;
    } else {
      params[answerParamName] = route.answer.id;
    }
  }

  const prefix = route.contentType === 'activity' ? activityPrefix : skillPrefix;
  const pagePath = isString(page) ? [ page ] : page;
  return [ '/', prefix, itemAlias ? itemAlias.alias : route.id, params, ...pagePath ];
}

function aliasFor(itemId: ItemId, path: string[]|undefined): { alias: string, validPath: boolean } | null {
  const redirects = appConfig.redirects;
  if (!redirects) return null;
  for (const [ k, v ] of Object.entries(redirects)) {
    if (v.id === itemId) return { alias: pathToAlias(k), validPath: !!v.path && !!path && arraysEqual(path, v.path) };
  }
  return null;
}

function pathToAlias(path: string): string {
  return path.replace(/\//g, '--');
}
