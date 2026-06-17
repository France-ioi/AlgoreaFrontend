import { arraysEqual } from 'src/app/utils/array';
import { ContentRoute } from './content-route';

/**
 * Specific type of content which has an identifier
 */
export interface EntityRoute extends ContentRoute {
  id: string,
}

/**
 * Specific type of entity which has an identifier path
 */
export interface EntityPathRoute extends EntityRoute {
  path: string[],
}


export function areSiblings(c1: EntityPathRoute, c2: EntityPathRoute): boolean {
  return c1.contentType === c2.contentType && arraysEqual(c1.path, c2.path);
}

export function areParentChild(c: { parent: EntityPathRoute, child: EntityPathRoute }): boolean {
  return c.parent.contentType === c.child.contentType && arraysEqual([ ...c.parent.path, c.parent.id ], c.child.path);
}

export function areSameElements(c1: EntityPathRoute, c2: EntityPathRoute): boolean {
  return c1.contentType === c2.contentType && c1.id === c2.id && arraysEqual(c1.path, c2.path);
}

/**
 * Whether `route` is the same item as `ancestor` or a descendant of it in the tree
 * (i.e. `[...ancestor.path, ancestor.id]` is a prefix of `[...route.path, route.id]`).
 */
export function isSameOrDescendantOf(
  ancestor: Pick<EntityPathRoute, 'id' | 'path'>,
  route: Pick<EntityPathRoute, 'id' | 'path'>,
): boolean {
  const ancestorPath = [ ...ancestor.path, ancestor.id ];
  const routePath = [ ...route.path, route.id ];
  if (routePath.length < ancestorPath.length) return false;
  return ancestorPath.every((segment, index) => routePath[index] === segment);
}
