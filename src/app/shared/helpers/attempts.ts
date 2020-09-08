
export interface Result {
  attempt_id: string,
  latest_activity_at: string,
  started_at: string|null
}

export function bestAttemptFromResults(results: Result[]): Result|null {
  if (!results || results.length === 0) {
    return null;
  }
  const startedResults = results.filter((r) => r.started_at !== null && r.latest_activity_at !== null);

  // pick the one with the greatest latest_activity_at
  return startedResults.reduce<Result|null>((acc, current) =>
    (acc === null || new Date(acc.latest_activity_at).getTime() < new Date(current.latest_activity_at).getTime()) ? current : acc,
  null);
}
