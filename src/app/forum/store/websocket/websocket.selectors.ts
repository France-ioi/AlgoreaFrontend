import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './websocket.store';

interface WebsocketSelectors<T> {
  selectWebsocketOpen: MemoizedSelector<T, boolean>,
}

// eslint-disable-next-line @ngrx/prefix-selectors-with-select
export const getWebsocketSelectors = <T>(selectWebsocket: Selector<T, State>): WebsocketSelectors<T> => ({
  selectWebsocketOpen: createSelector(
    selectWebsocket,
    state => state.open
  ),
});
