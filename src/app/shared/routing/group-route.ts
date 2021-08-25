import { ParamMap } from '@angular/router';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';

type GroupId = string;

export interface GroupRoute extends ContentRoute {
  contentType: 'group';
}

export function groupRoute(id: GroupId, path: string[] = []): GroupRoute {
  return { contentType: 'group', id: id, path };
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(route: GroupRoute, page: 'edit'|'details' = 'details'): any[] {
  return [ '/', 'groups', 'by-id', route.id, pathAsParameter(route.path), page ];
}

export function decodeGroupRouterParameters(params: ParamMap): { id: string | null; path: string[] | null } {
  const path = pathFromRouterParameters(params);
  return {
    id: params.get('id') || null,
    path: path ? path.split(',') : null,
  };
}
