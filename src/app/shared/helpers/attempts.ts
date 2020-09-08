
export interface Result {
  attempt_id: string,
  latest_activity_at: string|null,
  started_at: string|null
}

export function bestAttemptFromResults(results: Result[]): Result|null {
  if (!results || results.length === 0) {
    return null;
  }
  // pick the one which is started and with the greatest latest_activity_at
  return results.reduce<Result|null>((acc, current) => {
    if (current.started_at === null || current.latest_activity_at === null) return acc;
    if (acc === null || acc.latest_activity_at === null) return current;
    return new Date(acc.latest_activity_at).getTime() < new Date(current.latest_activity_at).getTime() ? current : acc;
  }, null);
}
