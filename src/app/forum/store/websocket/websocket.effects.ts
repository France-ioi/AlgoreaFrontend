import { createEffect } from '@ngrx/effects';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { inject } from '@angular/core';
import { EMPTY, catchError, map } from 'rxjs';
import { websocketClientActions } from './websocket.actions';
import { incomingThreadEventSchema } from '../../data-access/websocket-messages/threads-inbound-events';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { z } from 'zod/v4';

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
    // if the incoming message is not array, just ignore it. Otherwise return a list of messages which we were able to decode as events
    map(message => z.array(z.unknown()).parse(message).map(e => incomingThreadEventSchema.safeParse(e).data).filter(isNotUndefined)),
    catchError(err => {
      // eslint-disable-next-line no-console
      console.warn(err);
      return EMPTY; // ignore undecoded messages
    }),
    map(events => websocketClientActions.eventsReceived({ events }))
  ),
  { functional: true }
);
