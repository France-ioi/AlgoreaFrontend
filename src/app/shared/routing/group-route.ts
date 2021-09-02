import { ParamMap } from '@angular/router';
import { isNotUndefined } from '../helpers/null-undefined-predicates';
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

export type UserPage = 'personal-data';
export type GroupPage = 'edit' | 'details';

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(
  route: RawGroupRoute,
  { isUser, page }: { isUser?: boolean, page?: GroupPage | UserPage } = {},
): UrlCommand {
  const path = route.path ? pathAsParameter(route.path) : {};
  return isUser
    ? [ '/', 'groups', 'users', route.id, path, page && isUserPage(page) ? page : undefined ].filter(isNotUndefined)
    : [ '/', 'groups', 'by-id', route.id, path, page && isGroupPage(page) ? page : 'details' ];
}

function isUserPage(page: string): page is UserPage {
  return [ 'personal-data' ].includes(page);
}
function isGroupPage(page: string): page is GroupPage {
  return [ 'edit', 'details' ].includes(page);
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
