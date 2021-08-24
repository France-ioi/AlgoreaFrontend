import { ContentRoute, pathAsParameter } from './content-route';

type GroupId = string;

export interface GroupRoute extends ContentRoute {
  contentType: 'group';
}

export function groupRoute(id: GroupId): GroupRoute {
  return { contentType: 'group', id: id, path: [] };
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(route: GroupRoute, page: 'edit'|'details' = 'details'): any[] {
  return [ '/', 'groups', 'by-id', route.id, pathAsParameter(route.path), page ];
}
