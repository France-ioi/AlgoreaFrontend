import { animationFrames, EMPTY, Observable, ObservableInput, OperatorFunction, pipe } from 'rxjs';
import { map, scan, switchMap, take, takeUntil } from 'rxjs/operators';

interface Options {
  size?: number,
  until?: ObservableInput<any>,
  interval?: () => Observable<unknown>,
}
export function setListByBatch<T>({ size = 25, until = EMPTY, interval = animationFrames }: Options): OperatorFunction<T[], T[]> {
  let previousListSize = 0;
  return pipe(
    switchMap(list => {
      const startIndex = Math.max(previousListSize - size, 0);
      const numberOfItemsToAppend = Math.max(list.length - startIndex, 0);
      const maxCount = Math.max(1, Math.ceil(numberOfItemsToAppend / size));

      return interval().pipe(
        take(maxCount),
        takeUntil(until),
        scan(frameCount => frameCount + 1, 0),
        map(frameCount => startIndex + frameCount * size),
        map(lastIndex => {
          const nextItems = list.slice(0, lastIndex);
          previousListSize = nextItems.length;
          return nextItems;
        }),
      );
    })
  );
}
