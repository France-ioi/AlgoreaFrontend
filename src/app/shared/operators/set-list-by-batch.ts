import { animationFrames, EMPTY, Observable, of, OperatorFunction, pipe } from 'rxjs';
import { map, pairwise, scan, startWith, switchMap, takeUntil, takeWhile } from 'rxjs/operators';

interface Options {
  size?: number,
  until?: Observable<any>,
}
export function setListByBatch<T>({ size = 25, until = EMPTY }: Options): OperatorFunction<T[], T[]> {
  return pipe(
    startWith([] as T[]),
    pairwise(),
    switchMap(([ previousRows, rows ]) => {
      const startIndex = previousRows.length;
      const numberOfRowsToAppend = Math.max(rows.length - startIndex, 0);
      const maxCount = Math.ceil(numberOfRowsToAppend / size);

      return maxCount === 0 ? of(rows) : animationFrames().pipe(
        takeUntil(until),
        scan(count => count + 1, 0),
        takeWhile(count => count <= maxCount),
        map(count => count * size),
        map(lastIndex => rows.slice(0, startIndex + lastIndex)),
      );
    })
  );
}
