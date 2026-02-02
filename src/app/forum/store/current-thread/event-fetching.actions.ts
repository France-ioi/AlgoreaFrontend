import { createActionGroup, props } from '@ngrx/store';
import { ThreadEvent, MessageEvent } from '../../models/thread-events';
import { ThreadId } from '../../models/threads';
import { FetchState } from 'src/app/utils/state';

export const eventFetchingActions = createActionGroup({
  source: 'Event-related APIs',
  events: {
    logEventsFetchStateChanged: props<{ fetchState: FetchState<ThreadEvent[], ThreadId> }>(),
    slsEventsFetchStateChanged: props<{ fetchState: FetchState<MessageEvent[], ThreadId> }>(),
  },
});
