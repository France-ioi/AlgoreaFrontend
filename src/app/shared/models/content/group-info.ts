import { GroupRoute } from '../../routing/group-route';
import { ContentInfo, RoutedContentInfo } from './content-info';

export interface GroupInfo extends RoutedContentInfo {
  type: 'group',
  route: GroupRoute
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
