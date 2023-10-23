import { Thread, ThreadId } from '../../models/threads';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { IncomingThreadEvent } from 'src/app/services/threads-inbound-events';

export interface State {
  visible: boolean, // must not be `true` if `id` is not defined
  id: ThreadId | null,
  info: FetchState<Thread>,
  events: FetchState<IncomingThreadEvent[]>,
}

export const initialState: State = {
  visible: false,
  id: null,
  info: fetchingState(),
  events: fetchingState(),
};
