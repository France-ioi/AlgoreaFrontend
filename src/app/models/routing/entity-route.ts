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
