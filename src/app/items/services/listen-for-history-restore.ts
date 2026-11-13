import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { Task } from '../api/task-proxy';
import { HistoryRestore, HistoryRestoreRequest } from './history-restore.request';

/** After History navigates to the task, load the queued element on the editable task for that attempt. */
export function listenForHistoryRestore(
  restore: HistoryRestoreRequest,
  loadedTask$: Observable<Task>,
  attemptId$: Observable<string | undefined>,
  isReadOnly: () => boolean,
  destroyRef: DestroyRef,
): void {
  restore.pending$.pipe(
    filter((request): request is HistoryRestore => request !== null),
    switchMap(request => loadedTask$.pipe(
      catchError(() => EMPTY),
      switchMap(task => attemptId$.pipe(
        filter(attemptId => attemptId === request.attemptId && !isReadOnly()),
        take(1),
        tap(() => restore.consume(request)),
        switchMap(() => task.reloadHistory({ elementId: request.elementId }).pipe(
          catchError(() => EMPTY),
        )),
      )),
    )),
    takeUntilDestroyed(destroyRef),
  ).subscribe();
}
