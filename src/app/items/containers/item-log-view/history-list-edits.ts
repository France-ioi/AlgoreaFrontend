import { TaskHistoryElement } from 'src/app/items/api/types';
import { HistoryListRow } from './history-list-merge';

export interface HistoryListEditRow {
  kind: 'edit',
  at: Date,
  edit: TaskHistoryElement,
  /** Checkpoint whose span this edit was loaded for. */
  checkpointId: number,
}

export type HistoryDisplayRow = HistoryListRow | HistoryListEditRow;

/**
 * `getHistory` bounds for one checkpoint span.
 * minId is the previous checkpoint (exclusive); maxId is this checkpoint (inclusive).
 * limit covers the edits in the span plus this checkpoint, which the response includes.
 */
export function checkpointEditQuery(
  checkpoint: TaskHistoryElement,
  rows: HistoryListRow[],
): { minId?: number, maxId: number, limit: number } {
  const checkpointIds = rows.filter(row => row.kind === 'checkpoint').map(row => row.checkpoint.id);
  const index = checkpointIds.indexOf(checkpoint.id);
  const previousId = index >= 0 ? checkpointIds[index + 1] : undefined;
  const editCount = checkpoint.sinceEarlierCheckpoint?.elementsCount ?? 0;
  return {
    ...(previousId !== undefined ? { minId: previousId } : {}),
    maxId: checkpoint.id,
    limit: Math.min(1000, Math.max(editCount + 1, 1)),
  };
}

/**
 * Insert expanded edits into a newest-first checkpoint/event list.
 *
 * Same-second rule (extends the checkpoint-above-event rule): checkpoint, then edit, then event.
 * A submission stays in its time slot among the edits of the span.
 */
export function insertExpandedEdits(
  rows: HistoryListRow[],
  expanded: ReadonlyMap<number, TaskHistoryElement[]>,
): HistoryDisplayRow[] {
  const edits: HistoryListEditRow[] = [];
  for (const [ checkpointId, elements ] of expanded) {
    for (const edit of elements) {
      if (edit.isCheckpoint) continue;
      edits.push({
        kind: 'edit',
        at: new Date(edit.datetime),
        edit,
        checkpointId,
      });
    }
  }
  const merged: HistoryDisplayRow[] = [ ...rows, ...edits ];
  const rank: Record<HistoryDisplayRow['kind'], number> = { checkpoint: 0, edit: 1, event: 2 };
  return merged.sort((a, b) => {
    const timeDiff = b.at.getTime() - a.at.getTime();
    if (timeDiff !== 0) return timeDiff;
    return rank[a.kind] - rank[b.kind];
  });
}

export type EditSpanMark = 'none' | 'stem' | 'line' | 'end';

/**
 * Marks the disclosure column for open checkpoint spans.
 * stem: the open checkpoint, line starts under its chevron.
 * line: rows between that checkpoint and its oldest shown edit.
 * end: that oldest edit, where the line stops midway through the cell.
 * A submission between those edits is included. Rows after the last edit are not.
 */
export function editSpanLine(rows: HistoryDisplayRow[]): EditSpanMark[] {
  const marks: EditSpanMark[] = rows.map(() => 'none');
  const editIndexes = new Map<number, number[]>();
  rows.forEach((row, index) => {
    if (row.kind !== 'edit') return;
    const indexes = editIndexes.get(row.checkpointId) ?? [];
    indexes.push(index);
    editIndexes.set(row.checkpointId, indexes);
  });
  rows.forEach((row, index) => {
    if (row.kind !== 'checkpoint') return;
    const below = (editIndexes.get(row.checkpoint.id) ?? []).filter(editIndex => editIndex > index);
    if (below.length === 0) return;
    const lastEdit = Math.max(...below);
    marks[index] = 'stem';
    for (let cursor = index + 1; cursor < lastEdit; cursor++) marks[cursor] = 'line';
    marks[lastEdit] = 'end';
  });
  return marks;
}

export function checkpointEditsToggleLabel(count: number, expanded: boolean): string {
  if (expanded) {
    return count === 1
      ? $localize`Hide 1 edit`
      : $localize`Hide ${count}:editCount: edits`;
  }
  return count === 1
    ? $localize`Show 1 edit`
    : $localize`Show ${count}:editCount: edits`;
}
