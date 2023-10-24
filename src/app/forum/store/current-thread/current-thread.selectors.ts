import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './current-thread.store';
import { Thread, ThreadId, canCurrentUserLoadAnswers, statusOpen } from '../../models/threads';
import { FetchState } from 'src/app/utils/state';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';
import { RawItemRoute, rawItemRoute } from 'src/app/models/routing/item-route';

interface CurrentThreadSelectors<T> {
  selectVisible: MemoizedSelector<T, boolean>,
  selectThreadId: MemoizedSelector<T, ThreadId | null>,
  selectHasThreadConfigured: MemoizedSelector<T, boolean>,
  selectItemRoute: MemoizedSelector<T, RawItemRoute | null>,
  selectInfo: MemoizedSelector<T, FetchState<Thread>>,
  selectThreadStatus: MemoizedSelector<T, { id: ThreadId, visible: boolean, open: boolean } | undefined>,
  selectToken: MemoizedSelector<T, string | undefined>,
  selectCanCurrentUserLoadAnswers: MemoizedSelector<T, boolean>,
  selectThreadStatusOpen: MemoizedSelector<T, boolean>,
  selectEvents: MemoizedSelector<T, FetchState<IncomingThreadEvent[]>>,
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
  const selectEvents = createSelector(
    selectCurrentThread,
    state => state.events
  );

  // composed selectors
  const selectHasThreadConfigured = createSelector(
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
  const selectToken = createSelector(
    selectInfo,
    info => (info.data ? info.data.token : undefined)
  );
  const selectCanCurrentUserLoadAnswers = createSelector(
    selectInfo,
    info => !!info.data && canCurrentUserLoadAnswers(info.data)
  );
  return {
    selectVisible,
    selectThreadId,
    selectInfo,
    selectEvents,
    selectHasThreadConfigured,
    selectItemRoute,
    selectThreadStatusOpen,
    selectThreadStatus,
    selectToken,
    selectCanCurrentUserLoadAnswers,
  };
};
