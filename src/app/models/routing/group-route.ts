import { Group } from 'src/app/groups/data-access/get-group-by-id.service';
import { User } from 'src/app/groups/models/user';
import { UrlCommand } from '../../utils/url';
import { ContentRoute } from './content-route';
import { groupGroupTypeCategory, GroupTypeCategory, userGroupTypeCategory } from '../../groups/models/group-types';
import { pathAsParameter } from './path-parameter';
import { GroupId, GroupPath } from '../ids';

export const myGroupsPage = 'mine';
export const managedGroupsPage = 'manage';
export type GroupPage = typeof myGroupsPage | typeof managedGroupsPage;

export const groupPathRouterPrefix = 'groups';
export const userPathRouterSubPrefix = 'users';
export const groupPathRouterSubPrefix = 'by-id';

export interface GroupRoute extends ContentRoute {
  contentType: GroupTypeCategory,
  id: GroupId,
  path: GroupPath,
}
export type RawGroupRoute = Omit<GroupRoute, 'path'> & Partial<Pick<GroupRoute, 'path'>>;

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
  return isUser(group) ? userGroupTypeCategory : groupGroupTypeCategory;
}

export function parseRouterPath(path: string[]): GroupTypeCategory | GroupPage | null {
  if (path[0] !== groupPathRouterPrefix) return null;
  const subPrefix = path[1];
  if (subPrefix === userPathRouterSubPrefix) return userGroupTypeCategory;
  if (subPrefix === groupPathRouterSubPrefix) return groupGroupTypeCategory;
  if (subPrefix === myGroupsPage) return myGroupsPage;
  if (subPrefix === managedGroupsPage) return managedGroupsPage;
  return null; // means the path is "/groups/something-unrecognized"
}

export function rawGroupRoute(group: GroupLike): RawGroupRoute {
  const groupId = 'id' in group ? group.id : group.groupId;
  return { contentType: contentType(group), id: groupId };
}

export function groupRoute(group: GroupLike, path: string[]): GroupRoute {
  return { ...rawGroupRoute(group), path };
}

export function isGroupRoute(route: ContentRoute | RawGroupRoute): route is GroupRoute {
  return (route.contentType === groupGroupTypeCategory || route.contentType === userGroupTypeCategory)
    && 'path' in route && Array.isArray(route.path);
}

export function isRawGroupRoute(route?: unknown): route is RawGroupRoute {
  if (typeof route !== 'object') return false;
  const contentType = (route as Record<string, unknown> | null)?.contentType;
  return contentType === groupGroupTypeCategory || contentType === userGroupTypeCategory;
}

/**
 * Return a url array (`commands` array) to the given group, on the given page.
 */
export function urlArrayForGroupRoute(route: RawGroupRoute|GroupPage, page?: string[]): UrlCommand {
  if (route === myGroupsPage || route === managedGroupsPage) {
    return [ '/', groupPathRouterPrefix, route ];
  } else {
    const path = route.path ? pathAsParameter(route.path) : {};
    const actualPage = page && ((isUser(route) && isUserPage(page)) || (!isUser(route) && isGroupPage(page))) ? page : [];
    const subPrefix = isUser(route) ? userPathRouterSubPrefix : groupPathRouterSubPrefix;
    return [ '/', groupPathRouterPrefix, subPrefix, route.id, path, ...actualPage ];
  }
}

function isUserPage(page: string[]): boolean {
  if (!page[0]) return false;
  return [ 'personal-data', 'settings' ].includes(page[0]);
}
function isGroupPage(page: string[]): boolean {
  if (!page[0]) return false;
  return [ 'members', 'managers', 'settings', 'access' ].includes(page[0]);
}
