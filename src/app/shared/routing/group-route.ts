import { ParamMap } from '@angular/router';
import { UrlCommand } from '../helpers/url';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';

type GroupId = string;

export interface GroupRoute extends ContentRoute {
  contentType: 'group';
}
export type RawGroupRoute = Omit<GroupRoute, 'path'> & Partial<Pick<ContentRoute, 'path'>>;

export interface GroupRouteError {
  tag: 'error';
  path?: string[];
  id?: string;
}

export function groupRoute(id: GroupId, path: string[]): GroupRoute {
  return { contentType: 'group', id: id, path };
}

export function rawGroupRoute(id: GroupId): RawGroupRoute {
  return { contentType: 'group', id };
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(route: RawGroupRoute, options?: { isUser?: boolean, page?: 'edit' | 'details' }): UrlCommand {
  const path = route.path ? pathAsParameter(route.path) : {};
  return options?.isUser
    ? [ '/', 'groups', 'users', route.id, path ]
    : [ '/', 'groups', 'by-id', route.id, path, options?.page ?? 'details' ];
}

export function decodeGroupRouterParameters(params: ParamMap): { id: string | null; path: string | null } {
  return {
    id: params.get('id'),
    path: pathFromRouterParameters(params),
  };
}

export function groupRouteFromParams(params: ParamMap): GroupRoute | GroupRouteError {
  const id = params.get('id') ?? undefined;
  const path = pathFromRouterParameters(params);
  if (!id || path === null) return { tag: 'error', id };

  const pathList = path === '' ? [] : path.split(',');
  return groupRoute(id, pathList);
}

export function isGroupRouteError(route: GroupRoute | GroupRouteError): route is GroupRouteError {
  return 'tag' in route && route.tag === 'error';
}
