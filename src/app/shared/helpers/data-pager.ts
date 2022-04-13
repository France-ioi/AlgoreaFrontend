import { map, Observable, ReplaySubject, shareReplay, switchScan } from 'rxjs';
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
  pageSize: number,
  /**
   * If an error occurs while loading more elements, we do not want the list to appear as broken.
   * The state will remain ready with old data and this callback will be triggered, allowing to display feedback
   */
  onLoadMoreError: (error: Error) => void,
}

export class DataPager<T> {
  private trigger$ = new ReplaySubject<{ reset: boolean }>(1);

  state$ : Observable<FetchState<T[]>> = this.trigger$.pipe(
    switchScan<{ reset: boolean }, FetchState<T[]>, Observable<FetchState<T[]>>>(
      (prev, { reset }) => {
        prev = reset ? fetchingState() : prev;
        const latestElement = prev.data !== undefined ? prev.data[prev.data.length-1] : undefined;
        return this.options.fetch(latestElement).pipe(
          mapToFetchState(),
          map<FetchState<T[]>, FetchState<T[]>>(state => {
            // Case 1: First fetch -> return state as is
            if (prev.data === undefined) return state;

            // Case 2: Additional fetch -> when loading more items
            // Case 2a: fetching -> pass previous data with previous list
            if (state.isFetching) return fetchingState(prev.data);
            // Case 2b: error -> Mark state as ready with previous data to avoid breaking the ui state but trigger the on error callback
            else if (state.isError) {
              this.options.onLoadMoreError(state.error);
              return readyState(prev.data);
            // Case 2c: ready -> accumulate list and return data enhanced with accumulated list (instead of only the fetch result)
            // if (state.isReady) {
            } else {
              return readyState([ ...prev.data, ...state.data ]);
            }
          })
        );
      }, fetchingState() /* switchScan seed */
    ),
    shareReplay(1),
  );
  canLoadMore$ = this.state$.pipe(map(state => state.data === undefined || canLoadMorePagedData(state.data, this.options.pageSize)));

  constructor(private options: PagerOptions<T>) {}

  load(): void {
    this.trigger$.next({ reset: false });
  }

  reset(): void {
    this.trigger$.next({ reset: true });
  }

}
