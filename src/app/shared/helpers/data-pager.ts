import { map, Observable, ReplaySubject, shareReplay, switchMap } from 'rxjs';
import { fetchingState, FetchState, readyState } from './state';
import { mapToFetchState } from '../operators/state';

export function canLoadMorePagedData<T>(list: T[], limit: number): boolean {
  /**
   * If list length is same as limit, it means we can still fetch.
   * For the edge case when the list length is same as limit but there's no more items, it will be
   * solved by itself at next call because the list will then be empty.
   */
  return list.length === limit;
}

interface PagerOptions<T> {
  fetch: (lastElement?: T) => Observable<T[]>,
  batchSize: number,
  /**
   * If an error occurs while loading more elements, we do not want the list to appear as broken.
   * The state will remain ready with old data and this callback will be triggered, allowing to display feedback
   */
  onLoadMoreError: (error: Error) => void,
}

export class DataPager<T> {
  private trigger$ = new ReplaySubject<void>(1);

  canLoadMore = true;
  state$: Observable<FetchState<T[]>> = this.trigger$.pipe(
    switchMap(() => this.options.fetch(this.lastElement).pipe(
      mapToFetchState(),
      map(state => {
        // Case 1: First fetch -> return state as is, and when ready populate our accumulator in prevision of further fetches
        if (this.acc.length === 0) {
          if (!state.isReady) return state;
          this.accumulate(state.data);
          return state;
        }

        // Case 2: Additional fetch -> when loading more items
        // Case 2a: fetching -> pass previous data with previous list
        if (state.isFetching) return fetchingState(this.acc);
        // Case 2b: error -> Mark state as ready with previous data to avoid breaking the ui state but trigger the on error callback
        if (state.isError) {
          this.options.onLoadMoreError(state.error);
          return readyState(this.acc);
        }
        // Case 2c: ready -> accumulate list and return data enhanced with accumulated list (instead of only the fetch result)
        if (state.isReady) {
          this.accumulate(state.data);
          return readyState(this.acc);
        }
        throw new Error('unhandled use case');
      }),
    )),
    shareReplay(1),
  );

  private lastElement?: T;
  private acc: T[] = [];

  constructor(private options: PagerOptions<T>) {}

  private accumulate(data: T[]): void {
    const newItems = data;
    this.canLoadMore = canLoadMorePagedData(newItems, this.options.batchSize);
    this.lastElement = this.canLoadMore ? newItems[newItems.length-1] : undefined;
    this.acc.push(...newItems);
  }


  load(): void {
    if (!this.canLoadMore) return;
    this.trigger$.next();
  }

  reset(): void {
    this.lastElement = undefined;
    this.canLoadMore = true;
    this.acc = [];
  }
}
