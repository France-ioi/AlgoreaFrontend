import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { Task } from 'src/app/items/api/task-proxy';
import { TaskHistoryElement } from 'src/app/items/api/types';
import { HistoryListRow } from './history-list-merge';
import { checkpointEditQuery, checkpointEditsToggleLabel } from './history-list-edits';

/** Open checkpoint spans on the History list. A late response cannot reopen a span the user closed. */
export class HistoryCheckpointExpansion {
  readonly expandedEdits = signal<ReadonlyMap<number, TaskHistoryElement[]>>(new Map());
  readonly loadingCheckpointId = signal<number | null>(null);
  private readonly expandNonce = new Map<number, number>();

  clear(): void {
    this.expandedEdits.set(new Map());
  }

  isExpanded(checkpointId: number): boolean {
    return this.expandedEdits().has(checkpointId);
  }

  toggleLabel(row: HistoryListRow & { kind: 'checkpoint' }): string {
    const count = row.checkpoint.sinceEarlierCheckpoint?.elementsCount ?? 0;
    return checkpointEditsToggleLabel(count, this.isExpanded(row.checkpoint.id));
  }

  toggle(
    row: HistoryListRow & { kind: 'checkpoint' },
    task: Task | undefined,
    rows: HistoryListRow[] | undefined,
    destroyRef: DestroyRef,
    onError: () => void,
  ): void {
    const id = row.checkpoint.id;
    const nonce = (this.expandNonce.get(id) ?? 0) + 1;
    this.expandNonce.set(id, nonce);
    if (this.expandedEdits().has(id)) {
      const next = new Map(this.expandedEdits());
      next.delete(id);
      this.expandedEdits.set(next);
      if (this.loadingCheckpointId() === id) this.loadingCheckpointId.set(null);
      return;
    }
    if (!task || !rows) return;
    this.loadingCheckpointId.set(id);
    task.getHistory(checkpointEditQuery(row.checkpoint, rows)).pipe(
      take(1),
      takeUntilDestroyed(destroyRef),
    ).subscribe({
      next: elements => {
        if (this.expandNonce.get(id) !== nonce) return;
        const next = new Map(this.expandedEdits());
        next.set(id, elements);
        this.expandedEdits.set(next);
        this.loadingCheckpointId.set(null);
      },
      error: () => {
        if (this.expandNonce.get(id) !== nonce) return;
        this.loadingCheckpointId.set(null);
        onError();
      },
    });
  }
}
