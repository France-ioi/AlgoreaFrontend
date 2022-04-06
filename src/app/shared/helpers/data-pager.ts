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

interface PagerOptions<Data extends any, T extends any, Args = any> {
  fetch: (args: Args, lastElement?: T) => Observable<Data>,
  batchSize: number,
  /** function to extract list from the data to accumulate it. In an accumulator. */
  dataToList: (data: Data) => T[],
  /** function to enhance data with the accumulated list. */
  listToData: (data: Data, list: T[]) => Data,
  /**
   * If an error occurs while loading more elements, we do not want the list to appear as broken.
   * The state will remain ready with old data and this callback will be triggered, allowing to display feedback
   */
  onLoadMoreError: (error: Error) => void,
}

export class DataPager<Data, T, Args = any> {
  private trigger$ = new ReplaySubject<{ args: Args, lastElement?: T }>(1);

  canLoadMore = true;
  state$: Observable<FetchState<Data>> = this.trigger$.pipe(
    switchMap(({ args, lastElement }) => this.options.fetch(args, lastElement).pipe(
      mapToFetchState(),
      map(state => {
        // Case 1: First fetch -> return state as is, and when ready populate our accumulator in prevision of further fetches
        if (!this.acc) {
          if (!state.isReady) return state;
          this.accumulate(state.data);
          return state;
        }

        // Case 2: Additional fetch -> when loading more items
        // Case 2a: fetching -> pass previous data with previous list
        if (state.isFetching) return fetchingState(this.options.listToData(this.acc.data, this.list));
        // Case 2b: error -> Mark state as ready with previous data to avoid breaking the ui state but trigger the on error callback
        if (state.isError) {
          this.options.onLoadMoreError(state.error);
          return readyState(this.options.listToData(this.acc.data, this.list));
        }
        // Case 2c: ready -> accumulate list and return data enhanced with accumulated list (instead of only the fetch result)
        if (state.isReady) {
          this.accumulate(state.data);
          return readyState(this.options.listToData(state.data, this.list));
        }
        throw new Error('unhandled use case');
      }),
    )),
    shareReplay(1),
  );

  private acc?: { lastElement?: T, data: Data };
  private list: T[] = [];

  constructor(private options: PagerOptions<Data, T, Args>) {}

  private accumulate(data: Data): void {
    const newItems = this.options.dataToList(data);
    this.canLoadMore = canLoadMorePagedData(newItems, this.options.batchSize);
    this.acc = { data, lastElement: this.canLoadMore ? newItems[newItems.length-1] : undefined };
    this.list.push(...newItems);
  }


  load(args: Args): void {
    if (!this.canLoadMore) return;
    this.trigger$.next({ args, lastElement: this.acc?.lastElement });
  }

  reset(): void {
    this.acc = undefined;
    this.canLoadMore = true;
    this.list = [];
  }
}
