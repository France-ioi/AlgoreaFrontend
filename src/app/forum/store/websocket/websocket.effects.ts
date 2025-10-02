import { createEffect } from '@ngrx/effects';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { websocketClientActions } from './websocket.actions';

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
    map(message => websocketClientActions.messageReceived({ message }))
  ),
  { functional: true }
);
