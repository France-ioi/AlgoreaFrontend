import { combineLatest, filter, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { canLoadMoreItems } from '../helpers/load-more';
import { fetchingState, FetchState, readyState } from '../helpers/state';
import { mapToFetchState, readyData } from './state';

type FromId = string;

interface WithLoadMore<Data> {
  state$: Observable<FetchState<Data>>,
  loadMore$: Observable<{ fromId: FromId } | null>,
  loadMoreError$: Observable<FetchState<Data>>,
}

interface WithLoadMoreOptions<Trigger extends { fromId?: FromId }, Data extends any, T extends any> {
  trigger$: Subject<Trigger>,
  fetcher: (trigger: Trigger) => Observable<Data>,
  limit: number,
  mapIdFromListItem: (item: T) => FromId,
  mapListFromData: (data: Data) => T[],
  mapListToData: (data: Data, list: T[]) => Data,
}

export function withLoadMore<Trigger extends { fromId?: FromId }, Data, T>({
  trigger$,
  fetcher,
  limit,
  mapIdFromListItem,
  mapListFromData,
  mapListToData,
}: WithLoadMoreOptions<Trigger, Data, T>): WithLoadMore<Data> {
  const stateWithTrigger$ = trigger$.pipe(
    switchMap(trigger => fetcher(trigger).pipe(
      mapToFetchState(),
      map(state => ({ state, trigger })),
    )),
    shareReplay(1),
  );

  let list: T[] = [];

  const readyData$ = stateWithTrigger$.pipe(
    map(({ state }) => state),
    readyData(),
    startWith(undefined),
  );

  const state$ = combineLatest([ stateWithTrigger$, readyData$ ]).pipe(
    // When state is ready, combine latest emits twice:
    // 1. when stateWithTrigger$ emits its value
    // 2. Right after 1. when readyData$ emits mapped value _from_ stateWithTrigger$
    // Checking that state.data and lastReadyData references match, it is a way to avoid that double emission.
    // And we need to avoid it otherwise the list is prepended with old items (`list` itself) twice instead of once
    filter(([{ state }, lastReadyData ]) => !state.isReady || state.data === lastReadyData),
    map(([{ state, trigger }, lastReadyData ]): FetchState<Data> => {
      if (!trigger.fromId) {
        list = state.isReady ? mapListFromData(state.data) : []; // init list for future load more treatment (if any)
        return state; // Not load more => normal treatment
      }

      if (lastReadyData === undefined) throw new Error('impossible: must have last ready data when loading more');

      // When loading more, we want to have a fetching indicator AND to keep the old data to let it displayed in the UI
      if (state.isFetching) return fetchingState(mapListToData(lastReadyData, list));

      // When loading more causes an error, we want to keep the old data instead of ripping everything.
      // There's another observable loadMoreError$ emitting load more errors aside to avoid ripping the UI with a FetchError state
      if (state.isError) return readyState(mapListToData(lastReadyData, list));

      list = [ ...list, ...mapListFromData(state.data) ];
      return readyState(mapListToData(state.data, list));
    }),
  );

  const loadMore$: Observable<{ fromId: string } | null> = stateWithTrigger$.pipe(
    map(({ state }) => state),
    readyData(),
    map(mapListFromData),
    map(list => {
      const last = list[list.length-1];
      if (last === undefined || !canLoadMoreItems(list, limit)) return null;
      return { fromId: mapIdFromListItem(last) };
    }),
  );

  const loadMoreError$ = stateWithTrigger$.pipe(
    filter(({ state, trigger: { fromId } }) => state.isError && !!fromId),
    map(({ state }) => state),
  );

  return {
    state$,
    loadMore$,
    loadMoreError$,
  };
}
