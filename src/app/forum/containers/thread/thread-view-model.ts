import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import equal from 'fast-deep-equal/es6';
import { Store } from '@ngrx/store';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { ThreadId } from 'src/app/forum/models/threads';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { FetchState, fetchingState, readyState } from 'src/app/utils/state';
import { mergeEvents, ThreadEvent } from '../../models/thread-events';
import { selectThreadInfo } from './thread.selectors';

export function mergeThreadEventsState(
  log: FetchState<ThreadEvent[], ThreadId>,
  sls: FetchState<ThreadEvent[], ThreadId>,
  ws: ThreadEvent[],
  isPageUnloading: boolean,
): FetchState<ThreadEvent[], ThreadId> {
  const identifier = log.identifier ?? sls.identifier;

  // Don't show errors if page is unloading (prevents flash on refresh)
  if (isPageUnloading) {
    const logData = log.data ?? [];
    const slsData = sls.data ?? [];
    const mergedData = mergeEvents([ logData, slsData, ws ]);
    return readyState(mergedData, identifier);
  }

  // Return error if either source has an error
  if (log.isError) return log;
  if (sls.isError) return sls;

  // Check if both are loading (initial load)
  const bothFetching = log.isFetching && sls.isFetching;
  const bothHaveNoData = log.data === undefined && sls.data === undefined;

  if (bothFetching && bothHaveNoData) {
    return fetchingState<ThreadEvent[], ThreadId>(undefined, identifier);
  }

  // At least one has data - merge what we have
  const logData = log.data ?? [];
  const slsData = sls.data ?? [];
  const mergedData = mergeEvents([ logData, slsData, ws ]);

  // If either is still fetching, mark as fetching but with data
  if (log.isFetching || sls.isFetching) {
    return fetchingState(mergedData, identifier);
  }

  return readyState(mergedData, identifier);
}

export interface BuildThreadStatusDeps {
  store: Pick<Store, 'select'>,
  getItemByIdService: GetItemByIdService,
  isCurrentUserThreadParticipant$: Observable<boolean>,
}

export function buildThreadStatus$(deps: BuildThreadStatusDeps): Observable<undefined | FetchState<
  { open: true, canClose: boolean } |
  { open: false, canOpen: boolean }
>> {
  return combineLatest([
    deps.store.select(selectThreadInfo),
    deps.isCurrentUserThreadParticipant$,
  ]).pipe(
    debounceTime(0), // to prevent race condition (service call immediately aborted)
    distinctUntilChanged(([ prev ], [ cur ]) => equal(prev.threadStatus, cur.threadStatus)),
    switchMap(([{ threadStatus, itemInfo, groupInfo }, isCurrentUserParticipant ]) => {
      if (!threadStatus || !threadStatus?.visible) return of(undefined);
      const { id, open } = threadStatus;
      if (open) return of(readyState({ open: true as const, canClose: isCurrentUserParticipant }));
      // if we have the info, decided without more fetching
      if (isCurrentUserParticipant && itemInfo) {
        return of(readyState({ open: false as const, canOpen: itemInfo.permissions.canRequestHelp }));
      }
      if (groupInfo) {
        return of(readyState({ open: false as const, canOpen: groupInfo.currentUserWatchGroup }));
      }
      // if we do not have the info ready, we have to fetch
      return deps.getItemByIdService.get(id.itemId, isCurrentUserParticipant ? {} : { watchedGroupId: id.participantId }).pipe(
        mapToFetchState(),
        map(state => {
          switch (state.tag) {
            case 'ready':
              if (isCurrentUserParticipant) return readyState({ open: false as const, canOpen: state.data.permissions.canRequestHelp });
              return readyState({ open: false as const, canOpen: true });
            case 'fetching':
              return fetchingState(); // fetching with no data
            case 'error':
              // 403 on that service means that they cannot watch the participant
              if (!isCurrentUserParticipant && errorIsHTTPForbidden(state.error)) {
                return readyState({ open: false as const, canOpen: false });
              }
              return state;
          }
        })
      );
    }),
  );
}
