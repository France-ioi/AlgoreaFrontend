import { Injectable, signal } from '@angular/core';

/**
 * History asks the item host to load the signed-in user's task on the URL attempt
 * while the History page stays visible. Clearing this does not unload a task that already loaded.
 */
@Injectable()
export class HistoryTaskLoadRequest {
  readonly pendingAttemptId = signal<string | null>(null);

  request(attemptId: string): void {
    this.pendingAttemptId.set(attemptId);
  }
}
