import { Thread, ThreadId } from '../../models/threads';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';
import { ThreadEvent } from '../../models/thread-events';
import { ThreadMessage } from 'src/app/data-access/thread-message.service';

export interface State {
  visible: boolean, // must not be `true` if `id` is not defined
  id: ThreadId | null,
  info: FetchState<Thread>,
  logEvents: FetchState<ThreadEvent[]>,
  slsEvents: FetchState<ThreadMessage[]>,
  wsEvents: IncomingThreadEvent[],
}

export const initialState: State = {
  visible: false,
  id: null,
  info: fetchingState(),
  logEvents: fetchingState(),
  slsEvents: fetchingState(),
  wsEvents: [],
};
