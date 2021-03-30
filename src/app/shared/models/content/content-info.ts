import { ContentBreadcrumb } from './content-breadcrumb';
import { ContentRoute } from '../../routing/content-route';

export interface ContentInfo {
  type: string
  breadcrumbs?: ContentBreadcrumb,
  editing?: boolean, // undefined: not allowed, otherwise: whether the current page is current being edited
  title?: string, // page title
  route?: ContentRoute,
  details?: any
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
