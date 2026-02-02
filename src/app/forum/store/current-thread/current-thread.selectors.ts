import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from '../forum.state';
import { Thread, ThreadId, canCurrentUserLoadAnswers, statusOpen } from '../../models/threads';
import { fetchingState, FetchState, readyState } from 'src/app/utils/state';
import { ThreadItemInfo } from './current-thread.store';
import { mergeEvents, ThreadEvent } from '../../models/thread-events';

interface CurrentThreadSelectors<T> {
  selectVisible: MemoizedSelector<T, boolean>,
  selectThreadId: MemoizedSelector<T, ThreadId | null>,
  selectThreadHydratedId: MemoizedSelector<T, { id: ThreadId, item: ThreadItemInfo } | null>,
  selectHasCurrentThread: MemoizedSelector<T, boolean>,
  selectInfo: MemoizedSelector<T, FetchState<Thread>>,
  selectThreadStatus: MemoizedSelector<T, { id: ThreadId, visible: boolean, open: boolean } | undefined>,
  selectThreadToken: MemoizedSelector<T, string | undefined>,
  selectCanCurrentUserLoadThreadAnswers: MemoizedSelector<T, boolean>,
  selectThreadStatusOpen: MemoizedSelector<T, boolean>,
  selectThreadEvents: MemoizedSelector<T, FetchState<ThreadEvent[], ThreadId>>,
}

// eslint-disable-next-line @ngrx/prefix-selectors-with-select
export const getCurrentThreadSelectors = <T>(selectForumState: Selector<T, State>): CurrentThreadSelectors<T> => {

  const selectCurrentThread = createSelector(
    selectForumState,
    state => state.currentThread
  );

  const selectIsForumEnabled = createSelector(
    selectForumState,
    state => state.enabled,
  );

  const selectVisible = createSelector(
    selectCurrentThread,
    state => state.visible
  );
  const selectThreadId = createSelector(
    selectIsForumEnabled,
    selectCurrentThread,
    (enabled, thread) => (enabled ? thread.id : null)
  );
  const selectInfo = createSelector(
    selectCurrentThread,
    state => state.info
  );
  const selectThreadEvents = createSelector(
    selectCurrentThread,
    ({ logEvents, slsEvents, wsEvents }): FetchState<ThreadEvent[], ThreadId> => {
      const identifier = logEvents.identifier ?? slsEvents.identifier;
      if (logEvents.isError) return logEvents;
      if (slsEvents.isError) return slsEvents;
      if (logEvents.isFetching || slsEvents.isFetching) {
        // Preserve previous data while fetching (if available)
        const hasPreviousData = logEvents.data !== undefined && slsEvents.data !== undefined;
        if (hasPreviousData) {
          return fetchingState(mergeEvents([ logEvents.data, slsEvents.data, wsEvents ]), identifier);
        }
        return fetchingState<ThreadEvent[], ThreadId>(undefined, identifier);
      }
      return readyState(mergeEvents([ logEvents.data, slsEvents.data, wsEvents ]), identifier);
    }
  );

  // composed selectors
  const selectThreadHydratedId = createSelector(
    selectCurrentThread,
    ({ id, item }) => (id && item ? { id, item } : null)
  );
  const selectHasCurrentThread = createSelector(
    selectThreadId,
    id => id !== null
  );
  const selectThreadStatusOpen = createSelector(
    selectInfo,
    info => !!info.data && statusOpen(info.data)
  );
  const selectThreadStatus = createSelector(
    selectThreadId,
    selectVisible,
    selectThreadStatusOpen,
    (id, visible, open) => (id ? { id, visible, open } : undefined)
  );
  const selectThreadToken = createSelector(
    selectInfo,
    info => (info.data ? info.data.token : undefined)
  );
  const selectCanCurrentUserLoadThreadAnswers = createSelector(
    selectInfo,
    info => !!info.data && canCurrentUserLoadAnswers(info.data)
  );
  return {
    selectVisible,
    selectThreadId,
    selectThreadHydratedId,
    selectInfo,
    selectThreadEvents,
    selectHasCurrentThread,
    selectThreadStatusOpen,
    selectThreadStatus,
    selectThreadToken,
    selectCanCurrentUserLoadThreadAnswers,
  };
};
