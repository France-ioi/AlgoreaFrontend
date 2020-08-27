
import { ParamMap } from '@angular/router';

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
  const params = {};
  if (item.attemptId) params[attemptParamName] = item.attemptId;
  else params[parentAttemptParamName] = item.parentAttemptId;
  params[pathParamName] = item.itemPath;
  return ['items', 'details', item.itemId, params];
}

export function itemFromDetailParams(params: ParamMap): NavItem {
  const pathAsString = params.get(pathParamName);
  const attemptId = params.get(attemptParamName);
  const parentAttemptID = params.get(parentAttemptParamName);
  return {
    itemId: params.get('id'),
    attemptId: attemptId === null ? undefined : attemptId,
    parentAttemptId: parentAttemptID === null ? undefined : parentAttemptID,
    itemPath: pathAsString.length === 0 ? [] : pathAsString.split(','),
  };
}
