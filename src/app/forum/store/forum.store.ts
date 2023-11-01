import { combineReducers } from '@ngrx/store';
import * as websocketStore from './websocket/websocket.store';
import * as currentThreadStore from './current-thread/current-thread.store';
import currentThreadReducers from './current-thread/current-thread.reducers';

interface State {
  websocket: websocketStore.State,
  currentThread: currentThreadStore.State,
}

const initialState: State = {
  websocket: websocketStore.initialState,
  currentThread: currentThreadStore.initialState,
};

export const reducer = combineReducers({
  websocket: websocketStore.reducer,
  currentThread: currentThreadReducers,
}, initialState);
