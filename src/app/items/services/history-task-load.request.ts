import { Injectable, signal } from '@angular/core';

export interface HistoryTaskLoad {
  attemptId: string,
  /** When set, load that participant's attempt read-only (observer editor history). */
  observedParticipantId?: string,
}

/**
 * History asks the item host to load a task attempt while the History page stays visible.
 * Clearing this does not unload a task that already loaded.
 */
@Injectable()
export class HistoryTaskLoadRequest {
  readonly pending = signal<HistoryTaskLoad | null>(null);

  /** Own-user load (editable) when `observedParticipantId` is omitted. */
  request(attemptId: string, options?: { observedParticipantId: string }): void {
    this.pending.set({
      attemptId,
      observedParticipantId: options?.observedParticipantId,
    });
  }

  /** Convenience for templates that only need the attempt id. */
  pendingAttemptId(): string | null {
    return this.pending()?.attemptId ?? null;
  }
}
