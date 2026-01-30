import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs';
import { websocketClientActions } from 'src/app/store/websocket';
import { isNotificationWsMessage, notificationWsMessageSchema } from 'src/app/models/notification';
import { notificationWebsocketActions } from './notification.actions';

export const notificationWebsocketEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(websocketClientActions.messageReceived),
      filter(({ message }) => isNotificationWsMessage(message)),
      map(({ message }) => notificationWsMessageSchema.parse(message)),
      map(wsMessage => notificationWebsocketActions.notificationReceived({
        notification: wsMessage.notification,
      })),
    ),
  { functional: true }
);
