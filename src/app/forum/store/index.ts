import * as websocketEffects from './websocket/websocket.effects';
import * as fetchThreadInfoEffects from './current-thread/fetchThreadInfo.effects';
import * as eventFetchingEffects from './current-thread/event-fetching.effects';
import * as threadSubscriptionEffects from './current-thread/threadSubscription.effects';
import * as currentThreadEffects from './current-thread/current-thread.effects';
import * as forumBaseEffects from './forum.effects';
import * as websocketIncomingMessageEffects from './current-thread/websocket-incoming-message.effects';
import { FunctionalEffect } from '@ngrx/effects';

export const forumEffects = (): Record<string, FunctionalEffect> => ({
  ...websocketEffects,
  ...fetchThreadInfoEffects,
  ...eventFetchingEffects,
  ...threadSubscriptionEffects,
  ...currentThreadEffects,
  ...forumBaseEffects,
  ...websocketIncomingMessageEffects,
});

export { fromForum } from './forum.feature';
