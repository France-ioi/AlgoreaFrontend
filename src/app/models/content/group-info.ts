import { GroupNavigationData } from '../../data-access/group-navigation.service';
import { GroupRoute } from '../routing/group-route';
import { ContentInfo, RoutedContentInfo } from './content-info';

export interface GroupInfo extends RoutedContentInfo {
  type: 'group',
  route: GroupRoute,
  navData?: GroupNavigationData,
  details?: GroupDetails,
}

export interface GroupDetails {
  name: string,
  currentUserCanWatchMembers: boolean,
  currentUserCanGrantGroupAccess: boolean,
}

export function isGroupInfo(info: ContentInfo|null): info is GroupInfo {
  return info !== null && info.type === 'group';
}

/**
 * Create a group info (about a specific group)
 */
export function groupInfo(g: Omit<GroupInfo, 'type'>): GroupInfo {
  return { ...g, type: 'group' };
}

export interface MyGroupsInfo extends ContentInfo {
  type: 'my-groups',
}
export function myGroupsInfo(info: Omit<MyGroupsInfo, 'type'>): MyGroupsInfo {
  return { ...info, type: 'my-groups' };
}
export function isMyGroupsInfo(info: ContentInfo|null): info is MyGroupsInfo {
  return info !== null && info.type === 'my-groups';
}
