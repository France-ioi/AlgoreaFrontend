import { createFeature } from '@ngrx/store';
import { reducer } from 'src/app/forum/store/forum.reducer';
import { getWebsocketSelectors } from 'src/app/forum/store/websocket/websocket.selectors';
import { getCurrentThreadSelectors } from 'src/app/forum/store/current-thread/current-thread.selectors';
import {
  forumThreadListActions,
  itemPageActions,
  threadPanelActions,
  topBarActions
} from 'src/app/forum/store/current-thread/current-thread.actions';
import { eventFetchingActions } from 'src/app/forum/store/current-thread/event-fetching.actions';

export const fromForum = {
  ...createFeature({
    name: 'forum',
    reducer,
    extraSelectors: ({ selectForumState, selectWebsocket }) => ({
      ...getWebsocketSelectors(selectWebsocket),
      ...getCurrentThreadSelectors(selectForumState)
    })
  }),
  topBarActions,
  forumThreadListActions,
  threadPanelActions,
  itemPageActions,
  eventFetchingActions,
};
