
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
