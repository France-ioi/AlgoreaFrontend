import * as _ from 'lodash-es';

export interface Result {
  attempt_id: string,
  latest_activity_at: string,
}

export function bestAttemptFromResults(results: Result[]): Result|null {
  if (!results || results.length === 0) {
    return null;
  }
  // sort by latest_activity_at
  const sortedResults = _.sortBy(results, (result) => new Date(result.latest_activity_at).getTime());
  return sortedResults[sortedResults.length-1];
}
