import { createActionGroup, props } from '@ngrx/store';
import { IncomingThreadEvent } from 'src/app/services/threads-inbound-events';

export const websocketClientActions = createActionGroup({
  source: 'Forum Websocket',
  events: {
    websocketStatusChange: props<{ open: boolean }>(),
    eventsReceived: props<{ events: IncomingThreadEvent[] }>(),
  },
});
