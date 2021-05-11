import { ContentRoute, pathParamName } from './content-route';

export interface GroupRoute extends ContentRoute {
  contentType: 'group';
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(route: GroupRoute, page: 'edit'|'details'|'users' = 'details'): any[] {
  const params: {[k: string]: any} = {};
  params[pathParamName] = route.path;

  if (page === 'users') {
    return [ '/', 'groups', 'users', route.id, params ];
  }

  return [ '/', 'groups', 'by-id', route.id, params, page ];
}
