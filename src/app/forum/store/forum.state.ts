import * as websocketStore from './websocket/websocket.store';
import * as currentThreadStore from './current-thread/current-thread.store';

interface State {
  websocket: websocketStore.State,
  currentThread: currentThreadStore.State,
}

export const initialState: State = {
  websocket: websocketStore.initialState,
  currentThread: currentThreadStore.initialState,
};
