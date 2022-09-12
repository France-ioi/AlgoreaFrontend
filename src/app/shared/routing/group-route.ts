import { ParamMap } from '@angular/router';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { User } from 'src/app/modules/group/http-services/get-user.service';
import { isNotUndefined } from '../helpers/null-undefined-predicates';
import { UrlCommand } from '../helpers/url';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';

export interface GroupRoute extends ContentRoute {
  contentType: 'group',
  isUser: boolean,
}
export type RawGroupRoute = Omit<GroupRoute, 'path'> & Partial<Pick<ContentRoute, 'path'>>;

export interface GroupRouteError {
  tag: 'error',
  path?: string[],
  id?: string,
}


export type GroupLike =
  | { id: Group['id'], isUser: boolean }
  | { id: Group['id'], type: string }
  | Pick<User, 'groupId' | 'login'>;

function isUser(group: GroupLike): boolean {
  return ('isUser' in group && group.isUser) || ('login' in group && !!group.login) || ('type' in group && group.type === 'User');
}

export function rawGroupRoute(group: GroupLike): RawGroupRoute {
  const groupId = 'id' in group ? group.id : group.groupId;
  return { contentType: 'group', id: groupId, isUser: isUser(group) };
}

export function groupRoute(group: GroupLike, path: string[]): GroupRoute {
  return { ...rawGroupRoute(group), path };
}

export function isGroupRoute(route: ContentRoute | RawGroupRoute): route is GroupRoute {
  return route.contentType === 'group' && route.path !== undefined;
}

export function isRawGroupRoute(route?: unknown): route is RawGroupRoute {
  return typeof route === 'object' && (route as Record<string, unknown> | null)?.contentType === 'group';
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(
  route: RawGroupRoute,
  page?: string[],
): UrlCommand {
  const path = route.path ? pathAsParameter(route.path) : {};
  return route.isUser
    ? [ '/', 'groups', 'users', route.id, path, ...(page && isUserPage(page) ? page : []) ].filter(isNotUndefined)
    : [ '/', 'groups', 'by-id', route.id, path, ...(page && isGroupPage(page) ? page : [ 'details' ]) ];
}

function isUserPage(page: string[]): boolean {
  return !isGroupPage(page);
}
function isGroupPage(page: string[]): boolean {
  return page[0] === 'edit' || page[0] === 'details';
}

export function decodeGroupRouterParameters(params: ParamMap): { id: string | null, path: string | null } {
  return {
    id: params.get('id'),
    path: pathFromRouterParameters(params),
  };
}

export function groupRouteFromParams(params: ParamMap, isUser = false): GroupRoute | GroupRouteError {
  const id = params.get('id') ?? undefined;
  const path = pathFromRouterParameters(params);
  if (!id || path === null) return { tag: 'error', id };

  const pathList = path === '' ? [] : path.split(',');

  return groupRoute({ id, isUser }, pathList);
}

export function isGroupRouteError(route: GroupRoute | GroupRouteError): route is GroupRouteError {
  return 'tag' in route && route.tag === 'error';
}
