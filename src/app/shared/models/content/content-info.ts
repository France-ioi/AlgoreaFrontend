import { ContentBreadcrumb } from './content-breadcrumb';
import { ContentRoute } from '../../routing/content-route';

export interface ContentInfo {
  type: string
  breadcrumbs?: ContentBreadcrumb,
  title?: string, // page title
  route?: ContentRoute,
}

export interface RoutedContentInfo extends ContentInfo {
  route: ContentRoute
}

/**
 * Create a misc content info
 */
export function contentInfo(c: Omit<ContentInfo, 'type'>): ContentInfo {
  return { ...c, type: 'misc' };
}
