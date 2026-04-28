import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { EMPTY, Subscription } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { MINUTES } from 'src/app/utils/duration';
import { reportAnError } from 'src/app/utils/error-handling/error-reporting';
import { TaskSessionHttpService } from '../data-access/task-session.service';
import { ItemTaskInitService } from './item-task-init.service';

const KEEP_ALIVE_INTERVAL = 2 * MINUTES;

@Injectable()
export class TaskSessionTrackerService implements OnDestroy {
  private taskSessionHttp = inject(TaskSessionHttpService);
  private taskInitService = inject(ItemTaskInitService);

  private token: string | null = null;
  private attemptId: string | null = null;
  private resultStartedAt: Date | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private initSubscription: Subscription | null = null;
  private initialized = false;
  private active = false;

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.clearInterval();
      if (this.token) this.taskSessionHttp.stopViaFetch(this.token);
      this.active = false;
    } else if (document.visibilityState === 'visible') {
      this.callStart();
      this.startInterval();
      this.active = true;
    }
  };

  private onBeforeUnload = (): void => {
    if (this.token) this.taskSessionHttp.stopViaFetch(this.token);
    this.active = false;
  };

  // Re-initialization is not needed: ItemDisplayComponent throws if route changes,
  // and attemptId only transitions from undefined to a value once during the component's lifetime.
  init(attemptId: string, resultStartedAt: Date | null): void {
    if (this.initialized) return;
    this.initialized = true;
    this.attemptId = attemptId;
    this.resultStartedAt = resultStartedAt;

    this.initSubscription = this.taskInitService.loadedTask$.pipe(
      take(1),
      switchMap(() => this.taskInitService.taskToken$.pipe(take(1))),
    ).subscribe(token => {
      this.token = token;
      this.callStart();
      this.startInterval();
      this.active = true;
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('beforeunload', this.onBeforeUnload);
    });
  }

  ngOnDestroy(): void {
    this.initSubscription?.unsubscribe();
    this.clearInterval();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('beforeunload', this.onBeforeUnload);

    if (this.active && this.token) {
      this.taskSessionHttp.stop(this.token).pipe(
        catchError(err => {
          if (!(err instanceof HttpErrorResponse)) reportAnError(err);
          return EMPTY;
        }),
      ).subscribe();
    }
  }

  private callStart(): void {
    if (!this.token || !this.attemptId) return;
    this.taskSessionHttp.start(this.token, this.attemptId, this.resultStartedAt ?? undefined).pipe(
      catchError(err => {
        if (!(err instanceof HttpErrorResponse)) reportAnError(err);
        return EMPTY;
      }),
    ).subscribe();
  }

  private callContinue(): void {
    if (!this.token || !this.attemptId) return;
    this.taskSessionHttp.continue(this.token, this.attemptId).pipe(
      catchError(err => {
        if (!(err instanceof HttpErrorResponse)) reportAnError(err);
        return EMPTY;
      }),
    ).subscribe();
  }

  private startInterval(): void {
    this.clearInterval();
    this.intervalId = setInterval(() => this.callContinue(), KEEP_ALIVE_INTERVAL);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
