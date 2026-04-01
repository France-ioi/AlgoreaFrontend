import { createFeature } from '@ngrx/store';
import { reducer } from './forum.reducer';
import { getCurrentThreadSelectors } from './current-thread/current-thread.selectors';
import {
  forumThreadListActions, threadPanelActions, notificationActions
} from './current-thread/current-thread.actions';
import { eventFetchingActions } from './current-thread/event-fetching.actions';
import { followStatusUiActions } from './current-thread/follow-status.actions';
import { createSelectThreadInlineContext } from './thread-inline.selectors';

export { isThreadInline } from './thread-inline.selectors';

const forumFeature = createFeature({
  name: 'forum',
  reducer,
  extraSelectors: ({ selectForumState }) => ({
    ...getCurrentThreadSelectors(selectForumState)
  })
});

export const fromForum = {
  ...forumFeature,
  selectThreadInlineContext: createSelectThreadInlineContext(forumFeature.selectVisibleThreadId),
  forumThreadListActions,
  threadPanelActions,
  eventFetchingActions,
  notificationActions,
  followStatusUiActions,
};
