import { createActionGroup, props } from '@ngrx/store';
import { FetchState } from 'src/app/utils/state';
import { Thread } from '../../models/threads';

export const fetchThreadInfoActions = createActionGroup({
  source: 'Forum API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<Thread> }>(),
  },
});
