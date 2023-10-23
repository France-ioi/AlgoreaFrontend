import { createActionGroup, emptyProps } from '@ngrx/store';

export const syncActions = createActionGroup({
  source: 'Forum Thread Sync',
  events: {
    forceSync: emptyProps(),
  },
});
