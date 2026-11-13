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
