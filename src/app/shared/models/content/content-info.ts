import { ContentBreadcrumb } from './content-breadcrumb';
import { ContentRoute } from '../../routing/content-route';
import { arraysEqual } from '../../helpers/array';

export interface ContentInfo {
  type: string,
  breadcrumbs?: ContentBreadcrumb,
  title?: string, // page title
  route?: ContentRoute,
  score?: { currentScore: number, bestScore: number, isValidated: boolean },
}

export interface RoutedContentInfo extends ContentInfo {
  route: ContentRoute,
}

/**
 * Create a misc content info
 */
export function contentInfo(c: Omit<ContentInfo, 'type'>): ContentInfo {
  return { ...c, type: 'misc' };
}

export function areSiblings(c1: RoutedContentInfo, c2: RoutedContentInfo): boolean {
  return c1.type === c2.type && arraysEqual(c1.route.path, c2.route.path);
}

export function areParentChild(c: { parent: RoutedContentInfo, child: RoutedContentInfo }): boolean {
  return c.parent.type === c.child.type && arraysEqual([ ...c.parent.route.path, c.parent.route.id ], c.child.route.path);
}

export function areSameElements(c1: RoutedContentInfo, c2: RoutedContentInfo): boolean {
  return c1.type === c2.type && c1.route.id === c2.route.id && arraysEqual(c1.route.path, c2.route.path);
}
