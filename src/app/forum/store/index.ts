import { createFeature } from '@ngrx/store';
import { reducer } from './forum.store';
import * as websocketEffects from './websocket/websocket.effects';
import * as fetchThreadInfoEffects from './current-thread/fetchThreadInfo.effects';
import * as syncEffects from './current-thread/sync.effects';
import * as threadSubscriptionEffects from './current-thread/threadSubscription.effects';
import { getCurrentThreadSelectors } from './current-thread/current-thread.selectors';
import { currentThreadActions } from './current-thread/current-thread.actions';
import { syncActions } from './current-thread/sync.actions';
import { getWebsocketSelectors } from './websocket/websocket.selectors';

export const forumFeature = createFeature({
  name: 'forumFeature',
  reducer,
  extraSelectors: ({ selectWebsocket, selectCurrentThread }) => ({
    ...getWebsocketSelectors(selectWebsocket),
    ...getCurrentThreadSelectors(selectCurrentThread)
  })
});

export const forumEffects = { ...websocketEffects, ...fetchThreadInfoEffects, ...syncEffects, ...threadSubscriptionEffects };
export const forumActions = { ...currentThreadActions, ...syncActions };
