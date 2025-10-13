import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ThreadId } from '../../models/threads';
import { ThreadItemInfo } from './current-thread.store';

export const topBarActions = createActionGroup({
  source: 'Top bar',
  events: {
    toggleCurrentThreadVisibility: emptyProps(),
  },
});

export const forumThreadListActions = createActionGroup({
  source: 'Forum Thread List Page',
  events: {
    showAsCurrentThread: props<{ id: ThreadId, item: ThreadItemInfo }>(),
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
    changeCurrentThreadId: props<{ id: ThreadId, item: ThreadItemInfo }>(),
  },
});
