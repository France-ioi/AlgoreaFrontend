import { createFeature } from '@ngrx/store';
import { reducer } from './forum.reducer';
import * as websocketEffects from './websocket/websocket.effects';
import * as fetchThreadInfoEffects from './current-thread/fetchThreadInfo.effects';
import * as syncEffects from './current-thread/event-sync.effects';
import * as threadSubscriptionEffects from './current-thread/threadSubscription.effects';
import * as currentThreadEffects from './current-thread/current-thread.effects';
import * as forumBaseEffects from './forum.effects';
import { getCurrentThreadSelectors } from './current-thread/current-thread.selectors';
import { topBarActions, forumThreadListActions, threadPanelActions, itemPageActions } from './current-thread/current-thread.actions';
import { itemPageEventSyncActions } from './current-thread/event-sync.actions';
import { getWebsocketSelectors } from './websocket/websocket.selectors';
import { FunctionalEffect } from '@ngrx/effects';

export const forumEffects = (): Record<string, FunctionalEffect> => ({
  ...websocketEffects,
  ...fetchThreadInfoEffects,
  ...syncEffects,
  ...threadSubscriptionEffects,
  ...currentThreadEffects,
  ...forumBaseEffects,
});

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
  itemPageEventSyncActions
};
