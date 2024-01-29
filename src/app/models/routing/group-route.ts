import { ParamMap } from '@angular/router';
import { Group } from 'src/app/groups/data-access/get-group-by-id.service';
import { User } from 'src/app/groups/models/user';
import { UrlCommand } from '../../utils/url';
import { ContentRoute, pathAsParameter, pathFromRouterParameters } from './content-route';
import { GroupTypeCategory } from '../group-types';

export interface GroupRoute extends ContentRoute {
  contentType: GroupTypeCategory,
}
export type RawGroupRoute = Omit<GroupRoute, 'path'> & Partial<Pick<ContentRoute, 'path'>>;

export interface GroupRouteError {
  tag: 'error',
  path?: string[],
  id?: string,
}

export type GroupLike =
  | { id: Group['id'], contentType: GroupTypeCategory }
  | { id: Group['id'], isUser: boolean }
  | { id: Group['id'], type: string }
  | Pick<User, 'groupId' | 'login'>;

export function isUser(group: GroupLike): boolean {
  return ('contentType' in group && group.contentType === 'user') ||
    ('isUser' in group && group.isUser) ||
    ('login' in group && !!group.login) ||
    ('type' in group && group.type === 'User');
}

function contentType(group: GroupLike): GroupTypeCategory {
  return isUser(group) ? 'group' : 'user';
}

export function rawGroupRoute(group: GroupLike): RawGroupRoute {
  const groupId = 'id' in group ? group.id : group.groupId;
  return { contentType: contentType(group), id: groupId };
}

export function groupRoute(group: GroupLike, path: string[]): GroupRoute {
  return { ...rawGroupRoute(group), path };
}

export function isGroupRoute(route: ContentRoute | RawGroupRoute): route is GroupRoute {
  return (route.contentType === 'group' || route.contentType === 'user') && route.path !== undefined;
}

export function isRawGroupRoute(route?: unknown): route is RawGroupRoute {
  if (typeof route !== 'object') return false;
  const contentType = (route as Record<string, unknown> | null)?.contentType;
  return contentType === 'group' || contentType === 'user';
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(
  route: RawGroupRoute,
  page?: string[],
): UrlCommand {
  const path = route.path ? pathAsParameter(route.path) : {};
  const actualPage = page && ((isUser(route) && isUserPage(page)) || (!isUser(route) && isGroupPage(page))) ? page : [];
  return [ '/', 'groups', isUser(route) ? 'users' : 'by-id', route.id, path, ...actualPage ];
}

function isUserPage(page: string[]): boolean {
  if (!page[0]) return false;
  return [ 'personal-data', 'settings' ].includes(page[0]);
}
function isGroupPage(page: string[]): boolean {
  if (!page[0]) return false;
  return [ 'members', 'managers', 'settings', 'access' ].includes(page[0]);
}

export function decodeGroupRouterParameters(params: ParamMap): { id: string | null, path: string[] | null } {
  return {
    id: params.get('id'),
    path: pathFromRouterParameters(params),
  };
}

export function groupRouteFromParams(params: ParamMap, isUser = false): GroupRoute | GroupRouteError {
  const id = params.get('id') ?? undefined;
  const path = pathFromRouterParameters(params);
  if (!id || path === null) return { tag: 'error', id };
  return groupRoute({ id, isUser }, path);
}

export function isGroupRouteError(route: GroupRoute | GroupRouteError): route is GroupRouteError {
  return 'tag' in route && route.tag === 'error';
}
