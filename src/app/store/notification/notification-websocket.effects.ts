import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { websocketClientActions } from 'src/app/store/websocket';
import {
  isForumNewMessageNotification,
  isNotificationWsMessage,
  notificationWsMessageSchema,
} from 'src/app/models/notification';
import { notificationApiActions, notificationWebsocketActions } from './notification.actions';
import { fromForum } from 'src/app/forum/store';
import { NotificationHttpService } from 'src/app/data-access/notification.service';

/**
 * Handles incoming WebSocket notifications.
 * If the notification is about a thread that is currently visible, it is deleted immediately
 * instead of being added to the list. This handles race conditions where the backend might
 * send a notification for a thread that the user has already opened.
 * Note: The backend should not send notifications for threads the user is viewing, but we
 * handle this case defensively.
 */
export const notificationWebsocketEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    notificationService = inject(NotificationHttpService),
  ) =>
    actions$.pipe(
      ofType(websocketClientActions.messageReceived),
      filter(({ message }) => isNotificationWsMessage(message)),
      map(({ message }) => notificationWsMessageSchema.parse(message)),
      withLatestFrom(store$.select(fromForum.selectThreadStatus)),
      mergeMap(([ wsMessage, threadStatus ]) => {
        const notification = wsMessage.notification;

        // Check if notification is about the currently visible thread
        if (
          isForumNewMessageNotification(notification) &&
          threadStatus?.visible &&
          threadStatus.id.participantId === notification.payload.participantId &&
          threadStatus.id.itemId === notification.payload.itemId
        ) {
          // Delete immediately instead of adding
          return notificationService.deleteNotification(notification.sk).pipe(
            map(() => notificationApiActions.notificationDeleted({ sk: notification.sk })),
            catchError(() => of(notificationApiActions.notificationDeleted({ sk: notification.sk }))),
          );
        }

        // Normal flow: add notification
        return of(notificationWebsocketActions.notificationReceived({ notification }));
      }),
    ),
  { functional: true }
);
