import { ItemChildWithAdditions } from '../item-children-list/item-children';

/** How a TwoLevels L1 Chapter/Skill section should resolve its grand-children body. */
export type TwoLevelsContainerChildrenPlan =
  | { action: 'showLocked' }
  | { action: 'showExplicitEntry' }
  | { action: 'useNested', children: ItemChildWithAdditions[], attemptId: string }
  | { action: 'startAndFetch' }
  | { action: 'fetch', attemptId: string };

export function planTwoLevelsContainerChildren(item: ItemChildWithAdditions): TwoLevelsContainerChildrenPlan {
  if (item.isLocked) return { action: 'showLocked' };

  if (!item.result) {
    // startAndFetch matches implicitResultStart() in attempts.ts (content view + !requiresExplicitEntry);
    // isLocked above already gates content view.
    return item.requiresExplicitEntry
      ? { action: 'showExplicitEntry' }
      : { action: 'startAndFetch' };
  }

  if (item.children !== undefined) {
    return { action: 'useNested', children: item.children, attemptId: item.result.attemptId };
  }

  return { action: 'fetch', attemptId: item.result.attemptId };
}
