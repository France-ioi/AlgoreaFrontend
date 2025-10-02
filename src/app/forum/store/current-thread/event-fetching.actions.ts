import { createActionGroup, props } from '@ngrx/store';
import { ThreadEvent } from '../../models/thread-events';
import { FetchState } from 'src/app/utils/state';
import { ThreadMessage } from 'src/app/data-access/thread-message.service';

export const eventFetchingActions = createActionGroup({
  source: 'Event-related APIs',
  events: {
    logEventsFetchStateChanged: props<{ fetchState: FetchState<ThreadEvent[]> }>(),
    slsEventsFetchStateChanged: props<{ fetchState: FetchState<ThreadMessage[]> }>(),
  },
});
