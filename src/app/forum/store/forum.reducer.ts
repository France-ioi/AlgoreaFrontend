import { combineReducers, createReducer, on } from '@ngrx/store';
import * as websocketStore from './websocket/websocket.store';
import currentThreadReducers from './current-thread/current-thread.reducer';
import { initialState } from './forum.state';
import { configActions } from './forum.actions';

export const reducer = combineReducers({
  websocket: websocketStore.reducer,
  currentThread: currentThreadReducers,
  enabled: createReducer(initialState.enabled,
    on(configActions.forumEnabled, (_state, { enabled }): boolean => enabled),
  ),
}, initialState);
