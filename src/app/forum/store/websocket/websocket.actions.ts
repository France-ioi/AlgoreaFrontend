import { createActionGroup, props } from '@ngrx/store';
import { WsMessage } from '../../models/websocket-messages';

export const websocketClientActions = createActionGroup({
  source: 'Forum Websocket',
  events: {
    statusChanged: props<{ open: boolean }>(),
    messageReceived: props<{ message: WsMessage }>(),
  },
});
