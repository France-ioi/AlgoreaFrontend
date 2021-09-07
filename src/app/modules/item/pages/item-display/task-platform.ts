import { EMPTY, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TaskPlatform, Task } from '../../task-communication/task-proxy';
import { TaskParamsKeyDefault, TaskParamsValue, UpdateDisplayParams } from '../../task-communication/types';

export class ItemTaskPlatform extends TaskPlatform {
  constructor(private task$: Observable<Task>, private display$: Subject<UpdateDisplayParams>) {
    super();
  }

  validate(mode: string): Observable<void> {
    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }

    if (mode == 'validate') {
      return this.task$.pipe(
        // so that switchMap interrupts request if state changes
        switchMap(task => task.getAnswer().pipe(map(answer => ({ task, answer })))),
        switchMap(({ task, answer }) => task.gradeAnswer(answer, '')),
        switchMap((_results: any) =>
          // TODO Do something with the results
          EMPTY
        )
      );
    }
    // Other unimplemented modes
    return EMPTY;
  }

  updateDisplay(data: UpdateDisplayParams): Observable<void> {
    this.display$.next(data);
    return EMPTY;
  }

  getTaskParams(_keyDefault?: TaskParamsKeyDefault): Observable<TaskParamsValue> {
    const taskParams = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    return of(taskParams);
  }
}
