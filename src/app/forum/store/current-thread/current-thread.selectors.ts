import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from '../forum.state';
import { Thread, ThreadId, canCurrentUserLoadAnswers, statusOpen } from '../../models/threads';
import { FetchState } from 'src/app/utils/state';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';
import { EventLabel } from 'src/app/forum/models/thread-events';
import { ThreadItemInfo } from './current-thread.store';

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
  selectThreadEvents: MemoizedSelector<T, FetchState<IncomingThreadEvent[]>>,
  selectThreadNoMessages: MemoizedSelector<T, boolean>,
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
    state => state.events
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
  const selectThreadNoMessages = createSelector(
    selectThreadEvents,
    events => (events.data ? events.data.filter(event => event.label === EventLabel.AttemptStarted).length === 0 : false),
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
    selectThreadNoMessages,
  };
};
