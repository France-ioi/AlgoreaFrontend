import { createActionGroup, props } from '@ngrx/store';
import { MessageEvent } from '../../models/thread-events';
import { ThreadId } from '../../models/threads';

export const websocketIncomingMessageActions = createActionGroup({
  source: 'Websocket incoming message Effect',
  events: {
    forumMessageReceived: props<{ threadId: ThreadId, message: MessageEvent }>(),
  },
});
