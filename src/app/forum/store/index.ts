import { createFeature } from '@ngrx/store';
import { reducer } from './forum.reducer';
import * as fetchThreadInfoEffects from './current-thread/fetchThreadInfo.effects';
import * as eventFetchingEffects from './current-thread/event-fetching.effects';
import * as threadSubscriptionEffects from './current-thread/threadSubscription.effects';
import * as currentThreadEffects from './current-thread/current-thread.effects';
import * as forumBaseEffects from './forum.effects';
import * as websocketIncomingMessageEffects from './current-thread/websocket-incoming-message.effects';
import * as followStatusEffects from './current-thread/follow-status.effects';
import { getCurrentThreadSelectors } from './current-thread/current-thread.selectors';
import {
  forumThreadListActions, threadPanelActions, notificationActions
} from './current-thread/current-thread.actions';
import { FunctionalEffect } from '@ngrx/effects';
import { eventFetchingActions } from './current-thread/event-fetching.actions';
import { followStatusUiActions } from './current-thread/follow-status.actions';

export const forumEffects = (): Record<string, FunctionalEffect> => ({
  ...fetchThreadInfoEffects,
  ...eventFetchingEffects,
  ...threadSubscriptionEffects,
  ...currentThreadEffects,
  ...forumBaseEffects,
  ...websocketIncomingMessageEffects,
  ...followStatusEffects,
});

export const fromForum = {
  ...createFeature({
    name: 'forum',
    reducer,
    extraSelectors: ({ selectForumState }) => ({
      ...getCurrentThreadSelectors(selectForumState)
    })
  }),
  forumThreadListActions,
  threadPanelActions,
  eventFetchingActions,
  notificationActions,
  followStatusUiActions,
};
