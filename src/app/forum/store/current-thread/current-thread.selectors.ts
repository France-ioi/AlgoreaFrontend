import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './current-thread.store';
import { Thread, ThreadId, canCurrentUserLoadAnswers, statusOpen } from '../../models/threads';
import { FetchState } from 'src/app/utils/state';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';
import { RawItemRoute, rawItemRoute } from 'src/app/models/routing/item-route';

interface CurrentThreadSelectors<T> {
  selectVisible: MemoizedSelector<T, boolean>,
  selectThreadId: MemoizedSelector<T, ThreadId | null>,
  selectHasCurrentThread: MemoizedSelector<T, boolean>,
  selectItemRoute: MemoizedSelector<T, RawItemRoute | null>,
  selectInfo: MemoizedSelector<T, FetchState<Thread>>,
  selectThreadStatus: MemoizedSelector<T, { id: ThreadId, visible: boolean, open: boolean } | undefined>,
  selectThreadToken: MemoizedSelector<T, string | undefined>,
  selectCanCurrentUserLoadThreadAnswers: MemoizedSelector<T, boolean>,
  selectThreadStatusOpen: MemoizedSelector<T, boolean>,
  selectThreadEvents: MemoizedSelector<T, FetchState<IncomingThreadEvent[]>>,
  selectThreadNoMessages: MemoizedSelector<T, boolean>,
}

// eslint-disable-next-line @ngrx/prefix-selectors-with-select
export const getCurrentThreadSelectors = <T>(selectCurrentThread: Selector<T, State>): CurrentThreadSelectors<T> => {
  // raw selectors
  const selectVisible = createSelector(
    selectCurrentThread,
    state => state.visible
  );
  const selectThreadId = createSelector(
    selectCurrentThread,
    state => state.id
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
  const selectHasCurrentThread = createSelector(
    selectThreadId,
    id => id !== null
  );
  const selectItemRoute = createSelector(
    selectThreadId,
    id => (id ? rawItemRoute('activity', id.itemId) : null),
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
    events => (events.data ? events.data.filter(event => event.label === 'message').length === 0 : false),
  );
  return {
    selectVisible,
    selectThreadId,
    selectInfo,
    selectThreadEvents,
    selectHasCurrentThread,
    selectItemRoute,
    selectThreadStatusOpen,
    selectThreadStatus,
    selectThreadToken,
    selectCanCurrentUserLoadThreadAnswers,
    selectThreadNoMessages,
  };
};
