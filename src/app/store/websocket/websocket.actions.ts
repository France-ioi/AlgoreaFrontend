import { createActionGroup, props } from '@ngrx/store';
import { WsMessage } from 'src/app/models/websocket-messages';

export const websocketClientActions = createActionGroup({
  source: 'Websocket',
  events: {
    statusChanged: props<{ open: boolean }>(),
    messageReceived: props<{ message: WsMessage }>(),
  },
});
