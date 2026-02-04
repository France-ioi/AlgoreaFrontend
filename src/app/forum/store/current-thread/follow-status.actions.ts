import { createActionGroup, props } from '@ngrx/store';
import { FetchState } from 'src/app/utils/state';
import { ThreadId } from '../../models/threads';

export const followStatusActions = createActionGroup({
  source: 'Follow Status API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<boolean> }>(),
  },
});

export const followStatusUiActions = createActionGroup({
  source: 'Follow Status UI',
  events: {
    followToggled: props<{ threadId: ThreadId, follow: boolean }>(),
  },
});
