import { ItemRoute } from 'src/app/shared/helpers/item-route';
import { ItemDetails } from 'src/app/shared/services/current-content.service';
import { NavMenuItem } from '../http-services/item-navigation.service';

type Id = string;

/**
 * A ItemNavMenuData is container for all data which defines the state a item nav menu (on loaded state).
 * It is immutable, so you should use the function to get a transformed version of this.
 */
export class ItemNavMenuData {

  constructor(
    public readonly elements: NavMenuItem[], // level 1 elements (which may have children)
    public readonly pathToElements: Id[], // path from root to the elements (so including the parent if any)
    public readonly selectedElement?: ItemRoute, // the selected element is among lev 1 elements
    public readonly parent?: NavMenuItem, // level 0 element
    public readonly extraExpandedElements?: Id[], // elements to be expanded without being selected
  ) {}

  /**
   * Return this with selected element changed
   */
  withSelection(selectedElement: ItemRoute): ItemNavMenuData {
    return new ItemNavMenuData(this.elements, this.pathToElements, selectedElement, this.parent, this.extraExpandedElements);
  }

  /**
   * Return this with the element identified by id (at first level of `elements`) updated with the given details.
   * If the element was not found, return this.
   */
  withUpdatedDetails(id: Id, details: ItemDetails): ItemNavMenuData {
    const idx = this.elements.findIndex(i => i.id === id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx].title = details.title;
    elements[idx].attemptId = details.attemptId ?? null;
    elements[idx].bestScore = details.bestScore;
    elements[idx].currentScore = details.currentScore;
    elements[idx].validated = details.validated;
    return new ItemNavMenuData(elements, this.pathToElements, this.selectedElement, this.parent, this.extraExpandedElements);
  }

  /**
   * Return this with the element identified by id (at first level of `elements`) updated with info "self" and replaced children.
   * If the element was not found, return this.
   */
  withUpdatedInfo(id: Id, info: NavMenuItem, children: NavMenuItem[]): ItemNavMenuData {
    const idx = this.elements.findIndex(i => i.id === id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx] = { ...elements[idx], ...info, children: children };
    return new ItemNavMenuData(elements, this.pathToElements, this.selectedElement, this.parent, this.extraExpandedElements);
  }

  withUpdatedAttemptId(id: Id, newAttemptId: string): ItemNavMenuData {
    const idx = this.elements.findIndex(i => i.id === id);
    if (idx === -1) return this;
    const elements = [ ...this.elements ];
    elements[idx] = { ...elements[idx], attemptId: newAttemptId };
    return new ItemNavMenuData(elements, this.pathToElements, this.selectedElement, this.parent, this.extraExpandedElements);
  }

  /**
   * Remove the current selection but keep the item expanded if it has children
   */
  withNoSelection(): ItemNavMenuData {
    if (!this.selectedElement) return this;
    const element = this.elements.find(i => this.selectedElement?.id === i.id);
    const newExpanded = element?.hasChildren ? [ this.selectedElement.id ] : [];
    return new ItemNavMenuData(this.elements, this.pathToElements, undefined, this.parent, newExpanded);
  }

  /**
   * Create a new sub-ItemNavMenuData moving the child element and its siblings to `elements` and his parent as new parent.
   * Return this if id not found.
   */
  subNavMenuData(childElement: ItemRoute): ItemNavMenuData {
    const newParent = this.elements.find(i => i.children && i.children.some(c => c.id === childElement.id));
    if (!newParent || !newParent.children /* unexpected */) return this;
    return new ItemNavMenuData(newParent.children, this.pathToElements.concat([ newParent.id ]), childElement, newParent);
  }

  hasLevel1Element(id: Id): boolean {
    return this.elements.some(e => e.id === id);
  }

  hasLevel2Element(id: Id): boolean {
    return this.elements.some(e => e.children && e.children.some(c => c.id === id));
  }

  selectedNavMenuItem(): NavMenuItem|undefined {
    return this.elements.find(e => e.id === this.selectedElement?.id);
  }

}
