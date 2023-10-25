import { createEffect } from '@ngrx/effects';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { inject } from '@angular/core';
import { EMPTY, catchError, map } from 'rxjs';
import { websocketClientActions } from './websocket.actions';
import { decode, decodeOrNull } from 'src/app/utils/decoders';
import * as D from 'io-ts/Decoder';
import { incomingThreadEventDecoder } from '../../data-access/websocket-messages/threads-inbound-events';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const changeOpenStatusWebsocketClient = createEffect(
  (wsClient$ = inject(WebsocketClient)) => wsClient$.isWsOpen$.pipe(
    map(open => websocketClientActions.statusChange({ open }))
  ),
  { functional: true }
);

export const receiveWebsocketMessage = createEffect(
  (
    wsClient$ = inject(WebsocketClient)
  ) => wsClient$.inputMessages$.pipe(
    // if the incoming message is not array, just ignore it. Otherwise return a list of messages which we were able to decode as events
    map(message => decode(D.UnknownArray)(message).map(e => decodeOrNull(incomingThreadEventDecoder)(e)).filter(isNotNull)),
    catchError(() => EMPTY), // ignore undecoded messages
    map(events => websocketClientActions.eventsReceived({ events }))
  ),
  { functional: true }
);
