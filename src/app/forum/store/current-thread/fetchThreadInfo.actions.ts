import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ThreadInfo } from 'src/app/data-access/thread.service';
import { FetchState } from 'src/app/utils/state';

export const fetchThreadInfoActions = createActionGroup({
  source: 'Forum Thread Info Fetching',
  events: {
    fetchStateChange: props<{ fetchState: FetchState<ThreadInfo> }>(),
    infoRefresh: emptyProps(),
  },
});
