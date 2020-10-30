
export const defaultAttemptId = '0'; // to be used as parent attempt for root items

interface Result {
  latestActivityAt: Date,
  startedAt: Date|null,
}

export function bestAttemptFromResults<T extends Result>(results: T[]): T|null {
  if (!results || results.length === 0) {
    return null;
  }
  // pick the one which is started and with the greatest latest_activity_at
  return results.reduce<T|null>((acc, current) => {
    if (current.startedAt === null) return acc;
    if (acc === null) return current;
    return acc.latestActivityAt.getTime() < current.latestActivityAt.getTime() ? current : acc;
  }, null);
}

interface Item {
  requires_explicit_entry: boolean
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  }
}

export function implicitResultStart(item: Item): boolean {
  return item.permissions.can_view !== 'none' && !item.requires_explicit_entry;
}
