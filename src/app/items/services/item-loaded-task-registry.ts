import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../api/task-proxy';

export interface LoadedItemTask {
  task: Task,
  attemptId: string,
  /** True when negotiated ≥ 3 and metadata.savesHistory. Undefined until metadata is known. */
  savesEditorHistory: boolean | undefined,
}

/**
 * Bridges the task iframe (ItemDisplay / ItemTaskService) to sibling tabs such as History.
 * Provided on the item host so both the display and the log view share one instance.
 */
@Injectable()
export class ItemLoadedTaskRegistry {
  private readonly loaded$ = new BehaviorSubject<LoadedItemTask | null>(null);

  readonly snapshot$: Observable<LoadedItemTask | null> = this.loaded$.asObservable();

  set(value: LoadedItemTask): void {
    this.loaded$.next(value);
  }

  clear(): void {
    this.loaded$.next(null);
  }
}
