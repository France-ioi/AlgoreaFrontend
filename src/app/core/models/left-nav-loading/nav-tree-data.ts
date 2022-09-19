import { arraysEqual } from 'src/app/shared/helpers/array';
import { ensureDefined } from 'src/app/shared/helpers/assert';
import { ContentRoute } from 'src/app/shared/routing/content-route';
import { RootItem } from '../../http-services/item-navigation.service';

type Id = string;
export enum GroupManagership { False = 'false', True = 'true', Descendant = 'descendant' }

export interface NavTreeElement {
  // generic
  route: ContentRoute,
  title: string,
  hasChildren: boolean,
  children?: this[],
  navigateTo: (preventFullFrame?: boolean) => void,

  // specific uses
  locked?: boolean, // considering 'not set' as false
  associatedGroupName?: string,
  associatedGroupType?: RootItem['type'],
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
    public readonly pathToElements: Id[], // path from root to the elements (so including the parent if any)
    public readonly parent?: NavTreeElement, // level 0 element
    public readonly selectedElementId?: Id, // the selected element is among elements
  ) {}

  /**
   * Return this with selected element changed
   */
  withSelection(id: Id): NavTreeData {
    return new NavTreeData(this.elements, this.pathToElements, this.parent, id);
  }

  /**
   * Return this with the element from `elements` (identified by its id) replaced by the given one
   * If the element is not found, return this unchanged.
   */
  withUpdatedElement(route: ContentRoute, update: (el:NavTreeElement)=>NavTreeElement): NavTreeData {
    if (!arraysEqual(route.path, this.pathToElements)) throw new Error('unexpected: updated element not among tree elements');
    const idx = this.elements.findIndex(i => i.route.id === route.id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx] = update(ensureDefined(elements[idx]));
    return new NavTreeData(elements, this.pathToElements, this.parent, this.selectedElementId);
  }

  /**
   * Return this with children added to the element from `elements` (identified by its route)
   * If the element is not found, return this unchanged.
   */
  withChildren(route: ContentRoute, children: NavTreeElement[]): NavTreeData {
    if (!arraysEqual(route.path, this.pathToElements)) throw new Error('unexpected: children parent not among tree elements');
    const elements = this.elements.map(e => (e.route.id === route.id ? { ...e, children: children } : e));
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

  /**
   * Create a new sub-NavTreeData moving the child element and its siblings to `elements` and his parent as new parent.
   * If the element is not found, return this unchanged.
   */
  subNavMenuData(route: ContentRoute): NavTreeData {
    const newParent = this.elements.find(e => e.route.id === route.path[route.path.length-1]);
    if (!newParent || !newParent.children /* unexpected */) throw new Error('Unexpected: subNavMenuData did not find parent');
    return new NavTreeData(newParent.children, this.pathToElements.concat([ newParent.route.id ]), newParent, route.id);
  }

  hasElement(route: ContentRoute): boolean {
    return this.hasLevel1Element(route) || this.hasLevel2Element(route);
  }

  hasLevel1Element(route: ContentRoute): boolean {
    return arraysEqual(route.path, this.pathToElements) && this.elements.some(e => e.route.id === route.id);
  }

  hasLevel2Element(route: ContentRoute): boolean {
    if (!arraysEqual(route.path.slice(0,-1), this.pathToElements)) return false;
    const parent = this.elements.find(e => e.route.id === route.path[route.path.length-1]);
    if (!parent || !parent.children) return false;
    return parent.children.some(c => c.route.id === route.id);
  }

  selectedElement(): NavTreeElement|undefined {
    if (this.selectedElement === undefined) return undefined;
    return this.elements.find(e => e.route.id === this.selectedElementId);
  }

  /**
   * Search among the elements (level 1) for the given id
   */
  elementWithId(id: Id): NavTreeElement|undefined {
    return this.elements.find(i => i.route.id === id);
  }

}
