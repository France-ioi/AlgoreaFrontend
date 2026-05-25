import { computeNavigationNeighbors } from './nav-tree-navigation';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { EntityPathRoute } from '../../models/routing/entity-route';

function route(id: string, path: string[] = []): EntityPathRoute {
  return { contentType: 'activity', id, path };
}

function el(id: string, path: string[] = [], children?: NavTreeElement[]): NavTreeElement {
  return {
    route: route(id, path),
    title: id,
    hasChildren: !!children?.length,
    children,
    navigateTo: (): void => {},
  };
}

describe('computeNavigationNeighbors', () => {

  it('should return undefined when no element is selected', () => {
    const data = new NavTreeData([ el('a'), el('b') ], []);
    expect(computeNavigationNeighbors(data, null)).toBeUndefined();
  });

  it('should return undefined when the selected route is not found among elements', () => {
    const data = new NavTreeData([ el('a'), el('b') ], []).withSelection(route('z'));
    expect(computeNavigationNeighbors(data, null)).toBeUndefined();
  });

  it('should compute previous/next when selection is on an L1 sibling', () => {
    const data = new NavTreeData([ el('a'), el('b'), el('c') ], []).withSelection(route('b'));
    const n = computeNavigationNeighbors(data, null);
    expect(n).toBeDefined();
    expect(n!.previous).not.toBeNull();
    expect(n!.next).not.toBeNull();
  });

  it('should expose null previous/next for boundaries on L1', () => {
    const data = new NavTreeData([ el('a'), el('b') ], []).withSelection(route('a'));
    const n = computeNavigationNeighbors(data, null);
    expect(n!.previous).toBeNull();
    expect(n!.next).not.toBeNull();
  });

  it('should compute previous/next within L2 children when selection is a child', () => {
    const children = [ el('x', [ 'p', 'b' ]), el('y', [ 'p', 'b' ]), el('z', [ 'p', 'b' ]) ];
    const data = new NavTreeData([ el('a', [ 'p' ]), el('b', [ 'p' ], children) ], [ 'p' ])
      .withSelection(route('y', [ 'p', 'b' ]));
    const n = computeNavigationNeighbors(data, null);
    expect(n).toBeDefined();
    expect(n!.parent).not.toBeNull(); // parent is the L1 element 'b'
    expect(n!.previous).not.toBeNull();
    expect(n!.next).not.toBeNull();
  });

  describe('duplicate id at different paths', () => {

    // Tree shape:
    //  L1 elements at path [p]: { a, t, c }   where c has L2 children including t at path [p, c]
    //  So id "t" appears twice:
    //   - as sibling of c at path [p]
    //   - as child of c at path [p, c]
    function buildDuplicateData(selected: EntityPathRoute): NavTreeData {
      const tAsChild = el('t', [ 'p', 'c' ]);
      const childrenOfC = [ el('x', [ 'p', 'c' ]), tAsChild, el('y', [ 'p', 'c' ]) ];
      const elements = [ el('a', [ 'p' ]), el('t', [ 'p' ]), el('c', [ 'p' ], childrenOfC) ];
      return new NavTreeData(elements, [ 'p' ]).withSelection(selected);
    }

    it('should locate T-as-child-of-C when the selected route\'s path is [p, c]', () => {
      const navigated: string[] = [];
      const tagged = (id: string, tag: string, path: string[], children?: NavTreeElement[]): NavTreeElement => ({
        ...el(id, path, children),
        navigateTo: (): void => {
          navigated.push(tag);
        },
      });
      const xChild = tagged('x', 'x', [ 'p', 'c' ]);
      const tAsChild = tagged('t', 't-as-child', [ 'p', 'c' ]);
      const yChild = tagged('y', 'y', [ 'p', 'c' ]);
      const c = tagged('c', 'c', [ 'p' ], [ xChild, tAsChild, yChild ]);
      const tAsSibling = tagged('t', 't-as-sibling', [ 'p' ]);
      const a = tagged('a', 'a', [ 'p' ]);
      const data = new NavTreeData([ a, tAsSibling, c ], [ 'p' ]).withSelection(route('t', [ 'p', 'c' ]));

      const n = computeNavigationNeighbors(data, null);
      expect(n).toBeDefined();

      // Selection is the L2 t (child of c) -> parent must be c, prev x, next y.
      n!.parent!.navigateTo();
      n!.previous!.navigateTo();
      n!.next!.navigateTo();
      expect(navigated).toEqual([ 'c', 'x', 'y' ]);
    });

    it('should locate T-as-sibling-of-C when the selected route\'s path is [p]', () => {
      const data = buildDuplicateData(route('t', [ 'p' ]));
      const n = computeNavigationNeighbors(data, null);
      expect(n).toBeDefined();
      // In L1 with siblings [a, t, c]: prev = a, next = c
      expect(n!.previous).not.toBeNull();
      expect(n!.next).not.toBeNull();
    });

    it('should pick the right T occurrence even though L1 also contains a T with a different path', () => {
      // Selection is the child T. L1 also contains a (different-path) T as sibling of C.
      // findIndex by bare id would have matched L1's T first; with full-route equality it must skip it.
      const navigated: string[] = [];
      const tAsChild: NavTreeElement = {
        ...el('t', [ 'p', 'c' ]),
        navigateTo: (): void => {
          navigated.push('t-child');
        },
      };
      const c: NavTreeElement = {
        ...el('c', [ 'p' ], [ tAsChild ]),
        navigateTo: (): void => {
          navigated.push('c');
        },
      };
      const tAsSibling: NavTreeElement = {
        ...el('t', [ 'p' ]),
        navigateTo: (): void => {
          navigated.push('t-sibling');
        },
      };
      const data = new NavTreeData([ tAsSibling, c ], [ 'p' ]).withSelection(route('t', [ 'p', 'c' ]));

      const n = computeNavigationNeighbors(data, null);
      expect(n).toBeDefined();
      // Parent must be C (not undefined or L0), confirming we matched the L2 occurrence.
      expect(n!.parent).not.toBeNull();
      n!.parent!.navigateTo();
      expect(navigated).toEqual([ 'c' ]);
    });

  });

  describe('navigationNeighborsRestrictedToDescendantOfElementId (LTI)', () => {

    it('should hide the parent when its id matches the restriction (id-only on purpose)', () => {
      const children = [ el('x', [ 'p', 'b' ]), el('y', [ 'p', 'b' ]) ];
      const data = new NavTreeData([ el('a', [ 'p' ]), el('b', [ 'p' ], children) ], [ 'p' ])
        .withSelection(route('y', [ 'p', 'b' ]));
      const n = computeNavigationNeighbors(data, 'b');
      expect(n!.parent).toBeNull();
    });

  });

});
