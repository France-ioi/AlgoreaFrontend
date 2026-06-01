import { ensureDefined } from 'src/app/utils/assert';
import { areSameElements } from 'src/app/models/routing/entity-route';
import { NavTreeData } from '../../models/left-nav-loading/nav-tree-data';

export interface NeighborInfo {
  navigateTo: () => void,
}

export interface NavigationNeighbors {
  parent: NeighborInfo|null,
  previous: NeighborInfo|null,
  next: NeighborInfo|null,
}

/**
 * Compute the previous/next/parent neighbors of the currently selected element in the given nav tree.
 *
 * Pure helper (no `this` dependency), kept separate from the service for unit testability and to make the equality semantics
 * explicit: selection identity is the full `EntityPathRoute` (id + path), so the same id appearing at two different paths is
 * treated as two distinct nodes.
 *
 * `restrictedToDescendantOfElementId` is the LTI restriction: when non-null, the parent neighbor is hidden if its id matches.
 * This check stays id-only on purpose — the restriction targets an entity regardless of its path occurrence.
 *
 * `disablePrevNextAmongRoots` disables prev/next when the selection is an L1 sibling with no parent element (root activities/skills).
 * Otherwise, prev/next is disabled when the parent-of-siblings element has `disableChildrenPrevNextNav` set.
 */
export function computeNavigationNeighbors(
  navData: NavTreeData,
  restrictedToDescendantOfElementId: string | null,
  disablePrevNextAmongRoots = false,
): NavigationNeighbors | undefined {
  const selectedRoute = navData.selectedElementRoute;
  if (!selectedRoute) return undefined;
  const l1Idx = navData.elements.findIndex(
    e => areSameElements(e.route, selectedRoute) || (e.children?.some(c => areSameElements(c.route, selectedRoute)) ?? false)
  );
  if (l1Idx < 0) return undefined;
  // `l1Idx >= 0` proves the element exists; `ensureDefined` is only needed because `noUncheckedIndexedAccess` widens the type.
  const l1Element = ensureDefined(navData.elements[l1Idx]);
  const inL1 = areSameElements(l1Element.route, selectedRoute); // otherwise, in L2
  const l2Idx = inL1 ? -1 : ensureDefined(l1Element.children).findIndex(e => areSameElements(e.route, selectedRoute));
  const parent = inL1 ? navData.parent : l1Element;
  const prev = inL1 ? navData.elements[l1Idx-1] : l1Element.children?.[l2Idx-1];
  const next = inL1 ? navData.elements[l1Idx+1] : l1Element.children?.[l2Idx+1];
  const prevNextDisabled = inL1
    ? (navData.parent ? !!navData.parent.disableChildrenPrevNextNav : disablePrevNextAmongRoots)
    : !!l1Element.disableChildrenPrevNextNav;
  return {
    parent: (parent && parent.route.id !== restrictedToDescendantOfElementId)
      ? { navigateTo: (): void => parent.navigateTo() }
      : null,
    previous: !prevNextDisabled && prev ? { navigateTo: (): void => prev.navigateTo() } : null,
    next: !prevNextDisabled && next ? { navigateTo: (): void => next.navigateTo() } : null,
  };
}
