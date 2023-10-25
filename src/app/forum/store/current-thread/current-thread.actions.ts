import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ThreadId } from '../../models/threads';

export const topBarActions = createActionGroup({
  source: 'Top bar',
  events: {
    toggleCurrentThreadVisibility: emptyProps(),
  },
});

export const forumThreadListActions = createActionGroup({
  source: 'Forum Thread List',
  events: {
    showAsCurrentThread: props<{ id: ThreadId }>(),
    hideCurrentThread: emptyProps(),
  },
});

export const threadPanelActions = createActionGroup({
  source: 'Thread Panel',
  events: {
    close: emptyProps(),
    threadStatusChanged: emptyProps(),
  },
});

export const itemPageActions = createActionGroup({
  source: 'Item Page',
  events: {
    currentThreadIdChange: props<{ id: ThreadId }>(),
  },
});
