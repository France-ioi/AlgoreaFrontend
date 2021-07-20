import { animationFrames, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

/**
 * Create an observable from an array of values, emitting progressively parts of the array (from its head to the full array).
 * Used to feed incrementally the UI with data.
 *
 * IE: `incrementSize` = 2, list = [1, 2, 3, 4, 5, 6] streams following values:
 * 1. [1, 2]             → list of size 2
 * 2. [1, 2, 3, 4]       → list of size 4
 * 3. [1, 2, 3, 4, 5, 6] → list of size 6
 *
 * IE: `incrementSize` = 2, `initialIncrementSize` = 3, list = [1, 2, 3, 4, 5, 6] streams following values:
 * 1. [1, 2, 3]          → list of size 3 (`initialIncrementSize`)
 * 2. [1, 2, 3, 4, 5]    → list of size 5 (→ 3 + 2)
 * 3. [1, 2, 3, 4, 5, 6] → full size list
 *
 * @param list array of any value
 * @param options
 * @param options.incrementSize the size of the increment (default: 25)
 * @param options.startIndex the size of the initial increment (if not set, start with `incrementSize`)
 * @param options.interval observable which emits interval at which the parts are emitted (default to animation frames)
 * @returns Observable of list
 */
export function progressiveObservableFromList<T>(list: T[], options: Options = {}): Observable<T[]> {
  const {
    incrementSize = 25,
    initialIncrementSize = incrementSize,
    interval = animationFrames,
  } = options;

  let incrementEndIndex = Math.max(initialIncrementSize - incrementSize, 0);
  const numberOfItemsToAppend = Math.max(list.length - incrementEndIndex, 0);
  const maxCount = Math.max(1, Math.ceil(numberOfItemsToAppend / incrementSize));

  return interval().pipe(
    take(maxCount),
    map(() => {
      incrementEndIndex += incrementSize;
      return list.slice(0, incrementEndIndex);
    })
  );
}

interface Options {
  incrementSize?: number,
  initialIncrementSize?: number,
  interval?: () => Observable<unknown>,
}
