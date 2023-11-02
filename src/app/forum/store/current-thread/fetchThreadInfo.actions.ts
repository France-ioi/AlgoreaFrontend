import { createActionGroup, props } from '@ngrx/store';
import { ThreadInfo } from 'src/app/data-access/thread.service';
import { FetchState } from 'src/app/utils/state';

export const fetchThreadInfoActions = createActionGroup({
  source: 'Forum API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<ThreadInfo> }>(),
  },
});
