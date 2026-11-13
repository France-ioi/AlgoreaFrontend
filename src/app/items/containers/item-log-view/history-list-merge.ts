import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { TaskHistoryElement } from 'src/app/items/api/types';

export interface HistoryListEventRow {
  kind: 'event',
  at: Date,
  event: ActivityLogs[number],
}

export interface HistoryListCheckpointRow {
  kind: 'checkpoint',
  at: Date,
  checkpoint: TaskHistoryElement,
}

export type HistoryListRow = HistoryListEventRow | HistoryListCheckpointRow;

export interface HistoryBuffersInput {
  events: ActivityLogs,
  eventsHasMore: boolean,
  checkpoints: TaskHistoryElement[],
  checkpointsHasMore: boolean,
}

export interface HistoryBuffersMerge {
  rows: HistoryListRow[],
  canLoadMore: boolean,
  fetchMoreEvents: boolean,
  fetchMoreCheckpoints: boolean,
}

/**
 * Merge attempt events with checkpoints into one newest-first list (first page).
 *
 * Same-second rule: when an event and a checkpoint share the same second, the checkpoint
 * appears first (above the event) in the newest-first list, so a submission at a checkpoint
 * time still reads as sitting after that checkpoint when scanning downward.
 */
export function mergeEventsAndCheckpoints(
  events: ActivityLogs,
  checkpoints: TaskHistoryElement[],
): HistoryListRow[] {
  const rows: HistoryListRow[] = [
    ...events.map((event): HistoryListEventRow => ({ kind: 'event', at: event.at, event })),
    ...checkpoints.map((checkpoint): HistoryListCheckpointRow => ({
      kind: 'checkpoint',
      at: new Date(checkpoint.datetime),
      checkpoint,
    })),
  ];

  return rows.sort((a, b) => {
    const timeDiff = b.at.getTime() - a.at.getTime();
    if (timeDiff !== 0) return timeDiff;
    if (a.kind === b.kind) return 0;
    return a.kind === 'checkpoint' ? -1 : 1;
  });
}

/**
 * Merge buffered pages from both streams. A row is shown only once both streams have reached
 * its time (watermark = max of each non-exhausted stream's oldest buffered time).
 */
export function mergeHistoryBuffers(input: HistoryBuffersInput): HistoryBuffersMerge {
  const eventsFrontier = streamFrontier(input.events.map(e => e.at.getTime()), input.eventsHasMore);
  const checkpointsFrontier = streamFrontier(
    input.checkpoints.map(c => new Date(c.datetime).getTime()),
    input.checkpointsHasMore,
  );
  const watermark = Math.max(eventsFrontier, checkpointsFrontier);
  const allRows = mergeEventsAndCheckpoints(input.events, input.checkpoints);
  const rows = allRows.filter(row => row.at.getTime() >= watermark);

  return {
    rows,
    canLoadMore: input.eventsHasMore || input.checkpointsHasMore,
    fetchMoreEvents: input.eventsHasMore && eventsFrontier === watermark,
    fetchMoreCheckpoints: input.checkpointsHasMore && checkpointsFrontier === watermark,
  };
}

/** Oldest time when hasMore; -∞ when exhausted; +∞ when hasMore but buffer empty. */
function streamFrontier(timesNewestFirst: number[], hasMore: boolean): number {
  if (!hasMore) return Number.NEGATIVE_INFINITY;
  if (timesNewestFirst.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...timesNewestFirst);
}
