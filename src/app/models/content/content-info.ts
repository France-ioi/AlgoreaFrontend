import { EntityPathRoute } from '../routing/entity-route';

export interface ContentInfo {
  type: string,
  route?: EntityPathRoute,
}

export interface RoutedContentInfo extends ContentInfo {
  route: EntityPathRoute,
}

/**
 * Create a misc content info
 */
export function contentInfo(c: Omit<ContentInfo, 'type'>): ContentInfo {
  return { ...c, type: 'misc' };
}
