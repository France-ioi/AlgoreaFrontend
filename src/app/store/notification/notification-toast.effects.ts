import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { take, tap } from 'rxjs';
import { isDisplayableNotification } from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { NotificationInteractionService } from 'src/app/services/notification-interaction.service';
import { notificationWebsocketActions } from './notification.actions';
import { toastMessageForNotification } from './notification-toast';

/**
 * Shows a toast for every displayable notification by default.
 * Click runs the shared activate path (forum → open thread; export → download/clear).
 * Dismiss (X) only hides the toast; the notification stays in the bell.
 */
export const showNotificationToastEffect = createEffect(
  (
    actions$ = inject(Actions),
    messageService = inject(MessageService),
    notificationInteraction = inject(NotificationInteractionService),
  ) => actions$.pipe(
    ofType(notificationWebsocketActions.notificationReceived),
    tap(({ notification }) => {
      const message = toastMessageForNotification(notification);
      if (!message) return;

      if (isDisplayableNotification(notification)) {
        message.onClick = (): void => {
          notificationInteraction.activate$(notification).pipe(take(1)).subscribe();
        };
      }

      messageService.add(message);
    }),
  ),
  { functional: true, dispatch: false },
);
