import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './current-thread.store';
import { Thread, ThreadId } from '../../models/threads';
import { FetchState } from 'src/app/utils/state';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';

interface CurrentThreadSelectors<T> {
  selectVisible: MemoizedSelector<T, boolean>,
  selectThreadId: MemoizedSelector<T, ThreadId | null>,
  selectInfo: MemoizedSelector<T, FetchState<Thread>>,
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
  selectInfo: createSelector(
    selectCurrentThread,
    state => state.info
  ),
  selectEvents: createSelector(
    selectCurrentThread,
    state => state.events
  )
});
