import { animationFrames, Observable } from 'rxjs';
import { map, scan, take } from 'rxjs/operators';

/**
 * Generate stream providing a list populated by chunks at each interval
 *
 * IE: size = 2, list = [1, 2, 3, 4, 5, 6] streams following values:
 * 1. [1, 2]             → merge 2 first items
 * 2. [1, 2, 3, 4]       → merge 2 new items
 * 3. [1, 2, 3, 4, 5, 6] → merge 2 new items
 *
 * IE: size = 2, startIndex = 3, list = [1, 2, 3, 4, 5, 6] streams following values:
 * 1. [1, 2, 3]          → until startIndex
 * 2. [1, 2, 3, 4, 5]    → merge 2 new items
 * 3. [1, 2, 3, 4, 5, 6] → merge the last remaining item
 *
 * @param list array of any value
 * @param options
 * @returns Observable of list
 */
export function progressiveListFromList<T>(list: T[], options: Options = {}): Observable<T[]> {
  const {
    chunkSize = 25,
    startIndex = 0,
    interval = animationFrames,
  } = options;

  const adjustedStartIndex = Math.max(startIndex - chunkSize, 0);
  const numberOfItemsToAppend = Math.max(list.length - adjustedStartIndex, 0);
  const maxCount = Math.max(1, Math.ceil(numberOfItemsToAppend / chunkSize));

  return interval().pipe(
    take(maxCount),
    scan(frameCount => frameCount + 1, 0),
    map(frameCount => adjustedStartIndex + frameCount * chunkSize),
    map(lastIndex => list.slice(0, lastIndex)),
  );
}

interface Options {
  chunkSize?: number,
  startIndex?: number,
  interval?: () => Observable<unknown>,
}
