import { Thread, ThreadId } from '../../models/threads';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { FullItemRoute, RawItemRoute } from 'src/app/models/routing/item-route';
import { ThreadEvent } from '../../models/thread-events';

export interface PreviousContentRoute {
  route: FullItemRoute,
  page: string[],
}

export interface ThreadItemInfo {
  route: RawItemRoute,
  title: string|null,
}

export interface State {
  visible: boolean, // must not be `true` if `id` is not defined
  id: ThreadId | null,
  info: FetchState<Thread>,
  item: ThreadItemInfo | null, // item information if there is a thread
  logEvents: FetchState<ThreadEvent[], ThreadId>,
  slsEvents: FetchState<ThreadEvent[], ThreadId>,
  wsEvents: ThreadEvent[],
  followStatus: FetchState<boolean>,
  previousContentRoute: PreviousContentRoute | null, // route to navigate back to after clicking "navigate to content"
}

export const initialState: State = {
  visible: false,
  id: null,
  info: fetchingState(),
  item: null,
  logEvents: fetchingState(),
  slsEvents: fetchingState(),
  wsEvents: [],
  followStatus: fetchingState(),
  previousContentRoute: null,
};
