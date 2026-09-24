import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take, tap } from 'rxjs';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { openForumThreadFromNotification$ } from 'src/app/forum/utils/open-forum-thread-from-notification';
import { isForumNewMessageNotification } from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { notificationWebsocketActions } from './notification.actions';
import { toastMessageForNotification } from './notification-toast';

/**
 * Shows a toast for every displayable notification by default.
 * Forum toasts stay clickable to open the thread; other types are informational.
 */
export const showNotificationToastEffect = createEffect(
  (
    actions$ = inject(Actions),
    messageService = inject(MessageService),
    getItemByIdService = inject(GetItemByIdService),
    store = inject(Store),
  ) => actions$.pipe(
    ofType(notificationWebsocketActions.notificationReceived),
    tap(({ notification }) => {
      const message = toastMessageForNotification(notification);
      if (!message) return;

      if (isForumNewMessageNotification(notification)) {
        message.onClick = (): void => {
          openForumThreadFromNotification$(notification, getItemByIdService, store)
            .pipe(take(1))
            .subscribe();
        };
      }

      messageService.add(message);
    }),
  ),
  { functional: true, dispatch: false },
);
