
import { ParamMap } from '@angular/router';

/* "name" of the parameters in the url */
const parentAttemptParamName = 'parentAttempId';
const attemptParamName = 'attempId';
const pathParamName = 'path';

export interface NavItem {
  itemId: string,
  attemptId?: string,
  parentAttemptId?: string,
  itemPath: string[]
}

export interface NavGroup {}

export function itemDetailsRoute(item: NavItem): any[] {
  const params: {[k: string]: any} = {};
  if (item.attemptId) params[attemptParamName] = item.attemptId;
  else params[parentAttemptParamName] = item.parentAttemptId;
  params[pathParamName] = item.itemPath;
  return ['items', 'details', item.itemId, params];
}

/**
 * Return null if some required parameters are missing.
 */
export function itemFromDetailParams(params: ParamMap): NavItem|undefined {
  const pathAsString = params.get(pathParamName);
  const attemptId = params.get(attemptParamName);
  const parentAttemptID = params.get(parentAttemptParamName);
  const id = params.get('id');
  if (id === null) return undefined;
  return {
    itemId: id,
    attemptId: attemptId === null ? undefined : attemptId,
    parentAttemptId: parentAttemptID === null ? undefined : parentAttemptID,
    itemPath: pathAsString === null || pathAsString.length === 0 ? [] : pathAsString.split(','),
  };
}

export function isPathGiven(params: ParamMap): boolean {
  return params.has(pathParamName);
}
