import { ParamMap } from '@angular/router';
import { defaultAttemptId } from '../helpers/attempts';
import { appConfig } from '../helpers/config';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';
import { ItemTypeCategory } from '../helpers/item-type';
import { isString } from '../helpers/type-checkers';
import { UrlCommand } from '../helpers/url';
import { arraysEqual } from '../helpers/array';

// url parameter names
export const activityPrefix = 'a';
export const skillPrefix = 's';
const parentAttemptParamName = 'pa';
const attemptParamName = 'a';
const answerParamName = 'answerId';
const answerBestParamName = 'answerBest';
const answerBestParticipantParamName = 'answerParticipantId';
const answerLoadAsCurrentParamName = 'answerLoadAsCurrent';

// alias for better readibility
type ItemId = string;
export type AttemptId = string;
type AnswerId = string;

/* **********************************************************************************************************
 * Item Route: Object storing information required to navigate to an item without need for fetching a path
 * ********************************************************************************************************** */

// FullItemRoute contains all required info (path and (self or parent) attempt) so that no more queries are required after navigation
// ItemRoute may miss the (self and parent) attempt, will require fetching results to determine attempt after navigation.
// RawItemRoute may miss path and attempt, will required fetching the path and attempts after navigation.
//
// When navigating, as many information as possible should be given to the item router so that the navigation is not slowed down.
// So always prefer usage of FullItemRoute over ItemRoute over RawItemRoute.
export interface ItemRoute extends ContentRoute {
  contentType: ItemTypeCategory,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answer?:
    { best?: undefined, id: AnswerId, participantId?: undefined, loadAsCurrent?: true } |
    { best: true, id?: undefined, participantId?: string /* not set if mine */, loadAsCurrent?: undefined },
}
type ItemRouteWithSelfAttempt = ItemRoute & { attemptId: AttemptId };
type ItemRouteWithParentAttempt = ItemRoute & { parentAttemptId: AttemptId };
export type FullItemRoute = ItemRouteWithSelfAttempt | ItemRouteWithParentAttempt;
export type RawItemRoute = Omit<ItemRoute, 'path'> & Partial<Pick<ItemRoute, 'path'>>;

export function isItemRoute(route: ContentRoute): route is ItemRoute {
  return ([ 'activity', 'skill' ].includes(route.contentType));
}

export function isFullItemRoute(route: ItemRoute): route is FullItemRoute {
  return !!route.attemptId || !!route.parentAttemptId;
}

export function isRouteWithSelfAttempt(item: FullItemRoute): item is ItemRouteWithSelfAttempt {
  return item.attemptId !== undefined;
}

export function rawItemRoute(contentType: ItemTypeCategory, id: ItemId, attrs?: Partial<ItemRoute>): RawItemRoute {
  return { contentType, id, ...attrs };
}
export function itemRoute(contentType: ItemTypeCategory, id: ItemId, path: string[]): ItemRoute {
  return { ...rawItemRoute(contentType, id), path };
}

type RequiredAttempt = { attemptId: AttemptId } | { parentAttemptId: AttemptId };
export function fullItemRoute(contentType: ItemTypeCategory, id: ItemId, path: string[], attempt: RequiredAttempt): FullItemRoute {
  return { ...itemRoute(contentType, id, path), ...attempt };
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
export const appDefaultItemRoute: FullItemRoute = {
  contentType: 'activity',
  id: appConfig.defaultActivityId,
  path: [],
  parentAttemptId: defaultAttemptId,
};


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
  answerLoadAsCurrent: boolean,
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
    answerLoadAsCurrent: params.get(answerLoadAsCurrentParamName) === '1',
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
      if (route.answer.loadAsCurrent) params[answerLoadAsCurrentParamName] = '1';
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
