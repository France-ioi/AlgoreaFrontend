import { Injectable, signal } from '@angular/core';

export interface HistoryTaskLoad {
  attemptId: string,
  /** When set, load that participant's attempt read-only (observer editor history). */
  observedParticipantId?: string,
}

/** The load History requests for an attempt: the observed user's attempt when observing one, else the own one. */
export function historyTaskLoadFor(attemptId: string, observedUserId: string | null): HistoryTaskLoad {
  return observedUserId ? { attemptId, observedParticipantId: observedUserId } : { attemptId };
}

/**
 * History asks the item host to load a task attempt while the History page stays visible.
 * Clearing this does not unload a task that already loaded.
 */
@Injectable()
export class HistoryTaskLoadRequest {
  readonly pending = signal<HistoryTaskLoad | null>(null);

  request(load: HistoryTaskLoad): void {
    this.pending.set(load);
  }

  /** Convenience for templates that only need the attempt id. */
  pendingAttemptId(): string | null {
    return this.pending()?.attemptId ?? null;
  }
}
