import { createActionGroup, emptyProps } from '@ngrx/store';

export const itemPageEventSyncActions = createActionGroup({
  source: 'Item page',
  events: {
    forceSyncCurrentThreadEvents: emptyProps(),
  },
});
