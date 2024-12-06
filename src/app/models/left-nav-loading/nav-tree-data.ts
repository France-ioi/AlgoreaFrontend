import { arraysEqual } from 'src/app/utils/array';
import { ensureDefined } from 'src/app/utils/assert';
import { EntityPathRoute } from '../routing/entity-route';

export enum GroupManagership { False = 'false', True = 'true', Descendant = 'descendant' }

export interface NavTreeElement {
  // generic
  route: EntityPathRoute,
  title: string,
  hasChildren: boolean,
  children?: this[],
  navigateTo: (preventFullFrame?: boolean) => void,

  // specific uses
  locked?: boolean, // considering 'not set' as false
  associatedGroupNames?: string[],
  score?: { bestScore: number, currentScore: number, validated: boolean },
  groupRelation?: { isMember: boolean, managership: 'none'|'direct'|'ancestor'|'descendant' },
}

/**
 * Tree data is:
 *   | A         <-- the parent of the selected element, if it has a parent to navigate to the top
 *     | B1      <-- B2, B3, B4, the siblings of the selected element (refered as `elements` below)
 *     | B2      <-- the selected element, always at this depth of the tree
 *       | M     <-- children of the selected element, if any
 *       | N
 *     | B3
 *     | B4
 */
export class NavTreeData {

  constructor(
    public readonly elements: NavTreeElement[], // level 1 elements (which may have children)
    public readonly pathToElements: EntityPathRoute['path'], // path from root to the elements (so including the parent if any)
    public readonly parent?: NavTreeElement, // level 0 element
    public readonly selectedElementId?: EntityPathRoute['id'], // the selected element is among elements
  ) {}

  /**
   * Return this with selected element changed
   */
  withSelection(id: EntityPathRoute['id']): NavTreeData {
    return new NavTreeData(this.elements, this.pathToElements, this.parent, id);
  }

  /**
   * Return this with the element from `elements` (identified by its id) replaced by the given one
   * If the element is not found, return this unchanged.
   */
  withUpdatedElement(route: EntityPathRoute, update: (el:NavTreeElement)=>NavTreeElement): NavTreeData {
    let l1Id: EntityPathRoute['id'];
    if (arraysEqual(route.path, this.pathToElements)) l1Id = route.id;
    else if (arraysEqual(route.path.slice(0, -1), this.pathToElements)) l1Id = ensureDefined(route.path[route.path.length-1]);
    else throw new Error('unexpected: updated element not among tree elements');

    const elements = this.elements.map(l1e => {
      if (l1e.route.id === l1Id) {
        if (l1e.route.id === route.id) return update(l1e);
        return { ...l1e, children: l1e.children?.map(l2e => (l2e.route.id === route.id ? update(l2e) : l2e)) };
      } else return l1e;
    });
    return new NavTreeData(elements, this.pathToElements, this.parent, this.selectedElementId);
  }

  /**
   * Return this with children added to the element from `elements` (identified by its route)
   * If the element is not found, return this unchanged.
   */
  withChildren(route: EntityPathRoute, children: NavTreeElement[]): NavTreeData {
    let id: EntityPathRoute['id'];
    if (arraysEqual(route.path, this.pathToElements)) id = route.id;
    else if (arraysEqual(route.path.slice(0, -1), this.pathToElements)) id = ensureDefined(route.path[route.path.length-1]);
    else throw new Error('unexpected: children parent not among tree elements');

    const elements = this.elements.map(e => (e.route.id === id ? { ...e, children: children } : e));
    return new NavTreeData(elements, this.pathToElements, this.parent, this.selectedElementId);
  }

  /**
   * Remove the current selection but keep the item expanded if it has children
   * If no element is selected, return this unchanged.
   */
  withNoSelection(): NavTreeData {
    if (!this.selectedElementId) return this;
    return new NavTreeData(this.elements, this.pathToElements, this.parent);
  }

}
