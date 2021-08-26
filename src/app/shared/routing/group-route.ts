import { ParamMap } from '@angular/router';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';

type GroupId = string;

export interface GroupRoute extends ContentRoute {
  contentType: 'group';
}
export interface GroupRouteError {
  tag: 'error';
  path?: string[];
  id?: string;
}

export function groupRoute(id: GroupId, path: string[]): GroupRoute {
  return { contentType: 'group', id: id, path };
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroup(id: string, path?: string[], page: 'edit' | 'details' = 'details'): any[] {
  return [ '/', 'groups', 'by-id', id, path && pathAsParameter(path), page ].filter(Boolean);
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
  const pathList = path === null ? undefined : path.split(',');

  if (!id || !pathList) return { tag: 'error', id, path: pathList };

  return groupRoute(id, pathList);
}

export function isGroupRouteError(route: GroupRoute | GroupRouteError): route is GroupRouteError {
  return 'tag' in route && route.tag === 'error';
}
