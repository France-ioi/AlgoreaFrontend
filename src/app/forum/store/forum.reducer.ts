import { combineReducers } from '@ngrx/store';
import * as websocketStore from './websocket/websocket.store';
import currentThreadReducers from './current-thread/current-thread.reducer';
import { initialState } from './forum.state';

export const reducer = combineReducers({
  websocket: websocketStore.reducer,
  currentThread: currentThreadReducers,
}, initialState);
