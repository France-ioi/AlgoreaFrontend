import { createActionGroup, props } from '@ngrx/store';

export const websocketClientActions = createActionGroup({
  source: 'Forum Websocket',
  events: {
    statusChanged: props<{ open: boolean }>(),
    messageReceived: props<{ message: unknown }>(),
  },
});
