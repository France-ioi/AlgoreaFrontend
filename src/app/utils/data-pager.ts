import { map, Observable, ReplaySubject, shareReplay, switchScan } from 'rxjs';
import { errorState, fetchingState, FetchState, readyState } from '../utils/state';
import { mapStateData, mapToFetchState } from './operators/state';

function canLoadMorePagedData<T>(list: T[], limit: number): boolean {
  /**
   * If list length is same as limit, it means we can still fetch.
   * For the edge case when the list length is same as limit but there's no more items, it will be
   * solved by itself at next call because the list will then be empty.
   */
  return list.length === limit;
}

interface PagerOptions<T> {
  fetch: (pageSize: number, lastElement?: T) => Observable<T[]>,
  pageSize: number,
  /**
   * If an error occurs while loading more elements, we do not want the list to appear as broken.
   * The state will remain ready with old data and this callback will be triggered, allowing to display feedback
   */
  onLoadMoreError: (error: unknown) => void,
}

interface PagedData<T> {
  list: T[],
  newItems: T[],
}

export class DataPager<T> {
  private trigger$ = new ReplaySubject<{ reset: boolean }>(1);

  private state$ = this.trigger$.pipe(
    switchScan(
      (prev, { reset }): Observable<FetchState<PagedData<T>>> => {
        prev = reset ? fetchingState() : prev;
        const latestElement = prev.data?.list[prev.data.list.length-1];
        return this.options.fetch(this.options.pageSize, latestElement).pipe(
          mapToFetchState(),
          map(state => {
            // Case 1: First fetch
            if (prev.data === undefined) {
              if (state.isReady) return readyState({ list: state.data, newItems: state.data });
              else if (state.isError) return errorState(state.error);
              else return fetchingState();
            }

            // Case 2: Additional fetch -> when loading more items
            // Case 2a: fetching -> pass previous data with previous list
            if (state.isFetching) return fetchingState(prev.data);
            // Case 2b: error -> Mark state as ready with previous data to avoid breaking the ui state but trigger the on error callback
            else if (state.isError) {
              this.options.onLoadMoreError(state.error);
              return readyState(prev.data);
            // Case 2c: ready -> accumulate list and return data enhanced with accumulated list (instead of only the fetch result)
            } else {
              return readyState({ list: [ ...prev.data.list, ...state.data ], newItems: state.data });
            }
          })
        );
      }, fetchingState() as FetchState<PagedData<T>> /* switchScan seed */
    ),
    shareReplay(1),
  );
  list$ = this.state$.pipe(mapStateData(pagedData => pagedData.list));
  canLoadMore$ = this.state$.pipe(
    map(state => state.data === undefined || canLoadMorePagedData(state.data.newItems, this.options.pageSize)),
  );

  constructor(private options: PagerOptions<T>) {}

  load(): void {
    this.trigger$.next({ reset: false });
  }

  reset(): void {
    this.trigger$.next({ reset: true });
  }

}
