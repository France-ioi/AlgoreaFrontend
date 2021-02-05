import { ItemRoute } from 'src/app/shared/helpers/item-route';

type Id = string;
interface Element {
  id: Id
  children?: this[]
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
export class NavTreeData<T extends Element> {

  constructor(
    public readonly elements: T[], // level 1 elements (which may have children)
    public readonly pathToElements: Id[], // path from root to the elements (so including the parent if any)
    public readonly selectedElementId?: Id, // the selected element is among elements
    public readonly parent?: T, // level 0 element
  ) {}

  /**
   * Return this with selected element changed
   */
  withSelection(selectedElement: Element): NavTreeData<T> {
    return new NavTreeData(this.elements, this.pathToElements, selectedElement.id, this.parent);
  }

  /**
   * Return this with the element from `elements` (identified by its id) replaced by the given one
   */
  withUpdatedElement(id: Id, update: (el:T)=>T): NavTreeData<T> {
    const idx = this.elements.findIndex(i => i.id === id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx] = update(elements[idx]);
    return new NavTreeData(elements, this.pathToElements, this.selectedElementId, this.parent);
  }

  /**
   * Remove the current selection but keep the item expanded if it has children
   */
  withNoSelection(): NavTreeData<T> {
    if (!this.selectedElementId) return this;
    return new NavTreeData(this.elements, this.pathToElements, undefined, this.parent);
  }

  /**
   * Create a new sub-NavTreeData moving the child element and its siblings to `elements` and his parent as new parent.
   * Return this if id not found.
   */
  subNavMenuData(childElement: ItemRoute): NavTreeData<T> {
    const newParent = this.elements.find(i => i.children && i.children.some(c => c.id === childElement.id));
    if (!newParent || !newParent.children /* unexpected */) return this;
    return new NavTreeData(newParent.children, this.pathToElements.concat([ newParent.id ]), childElement.id, newParent);
  }

  hasLevel1Element(id: Id): boolean {
    return this.elements.some(e => e.id === id);
  }

  hasLevel2Element(id: Id): boolean {
    return this.elements.some(e => e.children && e.children.some(c => c.id === id));
  }

  selectedElement(): T|undefined {
    if (this.selectedElement === undefined) return undefined;
    return this.elements.find(e => e.id === this.selectedElementId);
  }

}
