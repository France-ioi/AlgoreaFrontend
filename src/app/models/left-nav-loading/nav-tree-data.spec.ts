import { NavTreeData, NavTreeElement } from './nav-tree-data';
import { EntityPathRoute } from '../routing/entity-route';

function route(id: string, path: string[] = []): EntityPathRoute {
  return { contentType: 'activity', id, path };
}

function el(id: string, path: string[] = [], extras: Partial<NavTreeElement> = {}): NavTreeElement {
  return {
    route: route(id, path),
    title: id,
    hasChildren: !!extras.children?.length,
    navigateTo: (): void => {},
    ...extras,
  };
}

describe('NavTreeData', () => {

  describe('withSelection / withNoSelection', () => {

    it('should store the full selected route (id + path)', () => {
      const data = new NavTreeData([ el('a'), el('b') ], []);
      const selected = route('a', [ 'p' ]);
      expect(data.withSelection(selected).selectedElementRoute).toEqual(selected);
    });

    it('should distinguish two occurrences of the same id at different paths', () => {
      const data = new NavTreeData([ el('t', [ 'p' ]) ], [ 'p' ]);
      const selectedAsChild = route('t', [ 'p', 'c' ]);
      const selectedAsSibling = route('t', [ 'p' ]);

      const withChildSelection = data.withSelection(selectedAsChild);
      const withSiblingSelection = data.withSelection(selectedAsSibling);

      expect(withChildSelection.selectedElementRoute).toEqual(selectedAsChild);
      expect(withSiblingSelection.selectedElementRoute).toEqual(selectedAsSibling);
      // Same id but different paths => not equal routes
      expect(withChildSelection.selectedElementRoute).not.toEqual(withSiblingSelection.selectedElementRoute);
    });

    it('should clear the selection with withNoSelection', () => {
      const data = new NavTreeData([ el('a') ], []).withSelection(route('a'));
      expect(data.selectedElementRoute).toBeDefined();
      expect(data.withNoSelection().selectedElementRoute).toBeUndefined();
    });

    it('should return the same instance when calling withNoSelection on a tree without selection', () => {
      const data = new NavTreeData([ el('a') ], []);
      expect(data.withNoSelection()).toBe(data);
    });

  });

  describe('withChildren', () => {

    it('should attach children to the matching l1 element when route is the element itself', () => {
      const data = new NavTreeData([ el('a'), el('b') ], []);
      const children = [ el('c', [ 'b' ]), el('d', [ 'b' ]) ];
      const updated = data.withChildren(route('b'), children);
      expect(updated.elements[1]?.children).toEqual(children);
      expect(updated.elements[0]?.children).toBeUndefined();
    });

    it('should attach children to the l1 ancestor when route is a child of one of the elements', () => {
      // pathToElements = [p]; element a is at path [p]; route is child of a -> path [p, a]
      const data = new NavTreeData([ el('a', [ 'p' ]) ], [ 'p' ]);
      const childRoute = route('child', [ 'p', 'a' ]);
      const children = [ el('grandchild', [ 'p', 'a' ]) ];
      const updated = data.withChildren(childRoute, children);
      // children are placed on the l1 element 'a' (the parent identified by the route's last path segment)
      expect(updated.elements[0]?.children).toEqual(children);
    });

    it('should preserve the existing selection', () => {
      const selected = route('a', [ 'p' ]);
      const data = new NavTreeData([ el('a'), el('b') ], []).withSelection(selected);
      const updated = data.withChildren(route('a'), [ el('c', [ 'a' ]) ]);
      expect(updated.selectedElementRoute).toEqual(selected);
    });

  });

  describe('withUpdatedElement', () => {

    it('should update the matching l1 element', () => {
      const data = new NavTreeData([ el('a'), el('b') ], []);
      const updated = data.withUpdatedElement(route('b'), e => ({ ...e, title: 'B!' }));
      expect(updated.elements[0]?.title).toBe('a');
      expect(updated.elements[1]?.title).toBe('B!');
    });

    it('should update an l2 element (child of one of the elements)', () => {
      const childA = el('child', [ 'a' ]);
      const data = new NavTreeData([ el('a', [], { children: [ childA ] }), el('b') ], []);
      const updated = data.withUpdatedElement(route('child', [ 'a' ]), e => ({ ...e, title: 'updated' }));
      expect(updated.elements[0]?.children?.[0]?.title).toBe('updated');
    });

    it('should preserve the existing selection', () => {
      const selected = route('a');
      const data = new NavTreeData([ el('a'), el('b') ], []).withSelection(selected);
      const updated = data.withUpdatedElement(route('b'), e => ({ ...e, title: 'B!' }));
      expect(updated.selectedElementRoute).toEqual(selected);
    });

  });

});
