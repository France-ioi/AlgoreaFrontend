import * as _ from 'lodash-es';

export interface Result {
  attempt_id: string,
  latest_activity_at: string,
  started_at: string|null
}

export function bestAttemptFromResults(results: Result[]): Result|null {
  if (!results || results.length === 0) {
    return null;
  }
  // sort by latest_activity_at
  const startedResults = _.filter(results, (r) => r.started_at !== null && r.latest_activity_at !== null);
  const sortedResults = _.sortBy(startedResults, (result) => new Date(result.latest_activity_at).getTime());
  return sortedResults[sortedResults.length-1];
}
