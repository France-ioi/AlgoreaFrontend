import { EMPTY, interval, merge, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { SECONDS } from 'src/app/utils/duration';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemTaskService } from '../../services/item-task.service';

const heightSyncInterval = 0.2*SECONDS;

export function itemDisplayIframeHeight$(
  metadata$: Observable<{ autoHeight?: boolean }>,
  taskService: ItemTaskService,
): Observable<string | undefined> {
  return metadata$.pipe(
    switchMap(({ autoHeight }) => {
      if (autoHeight) return of(undefined);
      return merge(
        taskService.task$.pipe(
          switchMap(task => interval(heightSyncInterval).pipe(
            switchMap(() => task.getHeight().pipe(catchError(() => EMPTY))),
          )),
        ),
        taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
      ).pipe(map(height => `${height}px`));
    }),
    distinctUntilChanged(),
  );
}
