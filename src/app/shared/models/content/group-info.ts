import { ContentRoute } from '../../routing/content-route';
import { ContentInfo, RoutedContentInfo } from './content-info';

export interface GroupInfo extends RoutedContentInfo {
  type: 'group',
  route: ContentRoute
}

export function isGroupInfo(info: ContentInfo|null): info is GroupInfo {
  return info !== null && info.type === 'group';
}
