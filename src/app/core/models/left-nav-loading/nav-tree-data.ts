import { ensureDefined } from 'src/app/shared/helpers/null-undefined-predicates';

type Id = string;
export enum GroupManagership { False = 'false', True = 'true', Descendant = 'descendant' }

export interface NavTreeElement {
  // generic
  id: Id,
  title: string,
  hasChildren: boolean,
  children?: this[],
  navigateTo: (path: Id[]) => void,

  // specific uses
  locked?: boolean, // considering 'not set' as false
  associatedGroupName?: string,
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
    public readonly selectedElementId?: Id, // the selected element is among elements
    public readonly parent?: NavTreeElement, // level 0 element
  ) {}

  /**
   * Return this with selected element changed
   */
  withSelection(id: Id): NavTreeData {
    return new NavTreeData(this.elements, this.pathToElements, id, this.parent);
  }

  /**
   * Return this with the element from `elements` (identified by its id) replaced by the given one
   * If the element is not found, return this unchanged.
   */
  withUpdatedElement(id: Id, update: (el:NavTreeElement)=>NavTreeElement): NavTreeData {
    const idx = this.elements.findIndex(i => i.id === id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx] = update(ensureDefined(elements[idx]));
    return new NavTreeData(elements, this.pathToElements, this.selectedElementId, this.parent);
  }

  /**
   * Remove the current selection but keep the item expanded if it has children
   * If no element is selected, return this unchanged.
   */
  withNoSelection(): NavTreeData {
    if (!this.selectedElementId) return this;
    return new NavTreeData(this.elements, this.pathToElements, undefined, this.parent);
  }

  /**
   * Create a new sub-NavTreeData moving the child element and its siblings to `elements` and his parent as new parent.
   * If the element is not found, return this unchanged.
   */
  subNavMenuData(childElementId: Id): NavTreeData {
    const newParent = this.elements.find(i => i.children && i.children.some(c => c.id === childElementId));
    if (!newParent || !newParent.children /* unexpected */) return this;
    return new NavTreeData(newParent.children, this.pathToElements.concat([ newParent.id ]), childElementId, newParent);
  }

  hasLevel1Element(id: Id): boolean {
    return this.selectedElementId == id || this.elements.some(e => e.id === id);
  }

  hasLevel2Element(id: Id): boolean {
    return this.elements.some(e => e.children && e.children.some(c => c.id === id));
  }

  selectedElement(): NavTreeElement|undefined {
    if (this.selectedElement === undefined) return undefined;
    return this.elements.find(e => e.id === this.selectedElementId);
  }

  /**
   * Search among the elements (level 1) for the given id
   */
  elementWithId(id: Id): NavTreeElement|undefined {
    return this.elements.find(i => i.id === id);
  }

}
