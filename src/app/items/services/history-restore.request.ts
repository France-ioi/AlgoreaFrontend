import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';

export interface HistoryRestore {
  elementId: number,
  attemptId: string,
}

/**
 * Queues a restore until navigation to the task view has finished, then exposes it until a loaded
 * editable task on that attempt consumes it.
 */
@Injectable()
export class HistoryRestoreRequest {
  private router = inject(Router);
  private readonly pending = signal<HistoryRestore | null>(null);
  readonly pending$ = toObservable(this.pending);

  /** Subscribe before navigating so the following NavigationEnd is the one that arms the restore. */
  queue(elementId: number, attemptId: string): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      take(1),
    ).subscribe(() => this.pending.set({ elementId, attemptId }));
  }

  consume(request: HistoryRestore): void {
    if (this.pending() === request) this.pending.set(null);
  }
}
