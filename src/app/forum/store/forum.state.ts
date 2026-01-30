import * as currentThreadStore from './current-thread/current-thread.store';

export interface State {
  enabled: boolean,
  currentThread: currentThreadStore.State,
}

export const initialState: State = {
  enabled: false,
  currentThread: currentThreadStore.initialState,
};
