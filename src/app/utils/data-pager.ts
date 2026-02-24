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
  maxPageSize?: number,
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

type TriggerAction = { type: 'loadMore' } | { type: 'reset' } | { type: 'refresh' };

export class DataPager<T> {
  private trigger$ = new ReplaySubject<TriggerAction>(1);

  private state$ = this.trigger$.pipe(
    switchScan(
      (prev, action): Observable<FetchState<PagedData<T>>> => {
        const isReset = action.type === 'reset';
        const isRefresh = action.type === 'refresh';

        if (isReset) prev = fetchingState();

        const fetchPageSize = isRefresh
          ? Math.min(Math.max(prev.data?.list.length ?? 0, this.options.pageSize), this.options.maxPageSize ?? Infinity)
          : this.options.pageSize;
        const latestElement = (isReset || isRefresh) ? undefined : prev.data?.list[prev.data.list.length - 1];

        return this.options.fetch(fetchPageSize, latestElement).pipe(
          mapToFetchState(),
          map(state => {
            if (isRefresh) {
              if (state.isReady) {
                const newItems = state.data.length < fetchPageSize ? [] : state.data.slice(-this.options.pageSize);
                return readyState({ list: state.data, newItems });
              }
              if (state.isError) return errorState(state.error);
              return fetchingState(prev.data);
            }

            // First fetch (reset or initial load)
            if (prev.data === undefined) {
              if (state.isReady) return readyState({ list: state.data, newItems: state.data });
              else if (state.isError) return errorState(state.error);
              else return fetchingState();
            }

            // Load more
            if (state.isFetching) return fetchingState(prev.data);
            else if (state.isError) {
              this.options.onLoadMoreError(state.error);
              return readyState(prev.data);
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

  setPageSize(pageSize: number, maxPageSize?: number): void {
    this.options = { ...this.options, pageSize, maxPageSize };
  }

  load(): void {
    this.trigger$.next({ type: 'loadMore' });
  }

  reset(): void {
    this.trigger$.next({ type: 'reset' });
  }

  refresh(): void {
    this.trigger$.next({ type: 'refresh' });
  }
}
