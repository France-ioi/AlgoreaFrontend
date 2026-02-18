import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { ThreadId } from '../../models/threads';
import { ThreadItemInfo } from './current-thread.store';

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
    autoFollowTriggered: props<{ threadId: ThreadId }>(),
    navigatedToThreadContent: props<{ previousRoute: FullItemRoute, previousPage: string[] }>(),
    clearPreviousContent: emptyProps(),
  },
});

export const notificationActions = createActionGroup({
  source: 'Notification',
  events: {
    showThread: props<{ id: ThreadId, item: ThreadItemInfo }>(),
  },
});
