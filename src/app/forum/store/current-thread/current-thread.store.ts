import { Thread, ThreadId } from '../../models/threads';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { ThreadEvent } from '../../models/thread-events';

export interface State {
  visible: boolean, // must not be `true` if `id` is not defined
  id: ThreadId | null,
  info: FetchState<Thread>,
  logEvents: FetchState<ThreadEvent[]>,
  slsEvents: FetchState<ThreadEvent[]>,
  wsEvents: ThreadEvent[],
}

export const initialState: State = {
  visible: false,
  id: null,
  info: fetchingState(),
  logEvents: fetchingState(),
  slsEvents: fetchingState(),
  wsEvents: [],
};
