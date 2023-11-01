import { createActionGroup, props } from '@ngrx/store';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';

export const websocketClientActions = createActionGroup({
  source: 'Forum Websocket',
  events: {
    statusChanged: props<{ open: boolean }>(),
    eventsReceived: props<{ events: IncomingThreadEvent[] }>(),
  },
});
