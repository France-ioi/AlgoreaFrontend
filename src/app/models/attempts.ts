import { canCurrentUserViewContent, ItemPermWithView } from './item-view-permission';

export const defaultAttemptId = '0'; // to be used as parent attempt for root items

interface Result {
  latestActivityAt: Date,
  startedAt: Date|null,
}

export function bestAttemptFromResults<T extends Result>(results: T[]): T|null {
  if (results.length === 0) return null;

  // pick the one which is started and with the greatest latest_activity_at
  return results.reduce<T|null>((acc, current) => {
    if (current.startedAt === null) return acc;
    if (acc === null) return current;
    return acc.latestActivityAt.getTime() < current.latestActivityAt.getTime() ? current : acc;
  }, null);
}

interface Item {
  requiresExplicitEntry: boolean,
  permissions: ItemPermWithView,
}

export function implicitResultStart(item: Item): boolean {
  return canCurrentUserViewContent(item) && !item.requiresExplicitEntry;
}
