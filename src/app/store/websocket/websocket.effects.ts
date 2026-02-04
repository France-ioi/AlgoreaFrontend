import { createEffect } from '@ngrx/effects';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { inject } from '@angular/core';
import { filter, map } from 'rxjs';
import { websocketClientActions } from './websocket.actions';
import { wsMessageSchema } from 'src/app/models/websocket-messages';

export const changeOpenStatusWebsocketClientEffect = createEffect(
  (wsClient$ = inject(WebsocketClient)) => wsClient$.isWsOpen$.pipe(
    map(open => websocketClientActions.statusChanged({ open }))
  ),
  { functional: true }
);

export const receiveWebsocketMessagEffect = createEffect(
  (
    wsClient$ = inject(WebsocketClient)
  ) => wsClient$.inputMessages$.pipe(
    map(message => wsMessageSchema.safeParse(message)),
    // ignore the messages which cannot be decoded
    filter(result => result.success),
    map(result => result.data),
    map(message => websocketClientActions.messageReceived({ message }))
  ),
  { functional: true }
);
