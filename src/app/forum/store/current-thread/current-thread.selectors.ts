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
export const getCurrentThreadSelectors = <T>(selectCurrentThread: Selector<T, State>): CurrentThreadSelectors<T> => ({
  selectVisible: createSelector(
    selectCurrentThread,
    state => state.visible
  ),
  selectThreadId: createSelector(
    selectCurrentThread,
    state => state.id
  ),
  selectHasThreadConfigured: createSelector(
    selectCurrentThread,
    state => state.id !== null
  ),
  selectItemRoute: createSelector(
    selectCurrentThread,
    state => (state.id ? rawItemRoute('activity', state.id.itemId) : null),
  ),
  selectInfo: createSelector(
    selectCurrentThread,
    state => state.info
  ),
  selectThreadStatus: createSelector(
    selectCurrentThread,
    state => (state.id ? {
      id: state.id,
      visible: state.visible,
      open: !!state.info.data && statusOpen(state.info.data),
    } : undefined)
  ),
  selectToken: createSelector(
    selectCurrentThread,
    state => (state.info.data ? state.info.data.token : undefined)
  ),
  selectCanCurrentUserLoadAnswers: createSelector(
    selectCurrentThread,
    state => !!state.info.data && canCurrentUserLoadAnswers(state.info.data)
  ),
  selectThreadStatusOpen: createSelector(
    selectCurrentThread,
    state => !!state.info.data && statusOpen(state.info.data)
  ),
  selectEvents: createSelector(
    selectCurrentThread,
    state => state.events
  )
});
