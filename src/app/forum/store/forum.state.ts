import * as websocketStore from './websocket/websocket.store';
import * as currentThreadStore from './current-thread/current-thread.store';

export interface State {
  enabled: boolean,
  websocket: websocketStore.State,
  currentThread: currentThreadStore.State,
}

export const initialState: State = {
  enabled: false,
  websocket: websocketStore.initialState,
  currentThread: currentThreadStore.initialState,
};
