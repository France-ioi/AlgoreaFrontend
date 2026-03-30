import { map, Observable, of, ReplaySubject, shareReplay, switchMap, switchScan } from 'rxjs';
import { errorState, fetchingState, FetchState, readyState } from '../utils/state';
import { mapStateData, mapToFetchState } from './operators/state';

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
  hasMore: boolean,
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

        if (isRefresh) {
          const targetCount = Math.max(prev.data?.list.length ?? 0, this.options.pageSize);
          const batchSize = Math.min(targetCount, this.options.maxPageSize ?? targetCount);

          // Fetch one extra to reliably detect whether more data exists
          return this.fetchPages(batchSize, targetCount + 1).pipe(
            mapToFetchState(),
            map(state => {
              if (state.isReady) {
                const hasMore = state.data.length > targetCount;
                const items = hasMore ? state.data.slice(0, targetCount) : state.data;
                return readyState({ list: items, hasMore });
              }
              if (state.isError) return errorState(state.error);
              return fetchingState(prev.data);
            })
          );
        }

        const latestElement = isReset ? undefined : prev.data?.list[prev.data.list.length - 1];
        // Fetch one extra to reliably detect whether more data exists
        const fetchSize = this.options.pageSize + 1;

        return this.options.fetch(fetchSize, latestElement).pipe(
          mapToFetchState(),
          map(state => {
            if (prev.data === undefined) {
              if (state.isReady) {
                const hasMore = state.data.length > this.options.pageSize;
                const list = hasMore ? state.data.slice(0, this.options.pageSize) : state.data;
                return readyState({ list, hasMore });
              }
              else if (state.isError) return errorState(state.error);
              else return fetchingState();
            }

            if (state.isFetching) return fetchingState(prev.data);
            else if (state.isError) {
              this.options.onLoadMoreError(state.error);
              return readyState(prev.data);
            } else {
              const hasMore = state.data.length > this.options.pageSize;
              const items = hasMore ? state.data.slice(0, this.options.pageSize) : state.data;
              return readyState({
                list: [ ...prev.data.list, ...items ],
                hasMore,
              });
            }
          })
        );
      }, fetchingState() as FetchState<PagedData<T>>
    ),
    shareReplay(1),
  );
  list$ = this.state$.pipe(mapStateData(pagedData => pagedData.list));
  canLoadMore$ = this.state$.pipe(
    map(state => state.data === undefined || state.data.hasMore),
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

  /**
   * Fetches multiple pages sequentially until at least `targetCount` items
   * are accumulated, or a batch returns fewer items than `batchSize`.
   */
  private fetchPages(batchSize: number, targetCount: number): Observable<T[]> {
    const fetchBatch = (accumulated: T[]): Observable<T[]> => {
      const lastElement = accumulated.length > 0 ? accumulated[accumulated.length - 1] : undefined;
      return this.options.fetch(batchSize, lastElement).pipe(
        switchMap(batch => {
          const all = [ ...accumulated, ...batch ];
          if (batch.length < batchSize || all.length >= targetCount) {
            return of(all);
          }
          return fetchBatch(all);
        })
      );
    };
    return fetchBatch([]);
  }
}
