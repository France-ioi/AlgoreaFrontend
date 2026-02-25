import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, EMPTY, from, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { fromForum } from 'src/app/forum/store';
import { isForumNewMessageNotification } from 'src/app/models/notification';
import { fromNotification } from './notification.store';
import { notificationApiActions } from './notification.actions';
import { APPCONFIG } from 'src/app/config';

export const clearNotificationsOnThreadShownEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    notificationService = inject(NotificationHttpService),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableNotifications ? actions$.pipe(
    ofType(
      fromForum.notificationActions.showThread,
      fromForum.forumThreadListActions.showAsCurrentThread,
    ),
    withLatestFrom(store$.select(fromNotification.selectNotificationsState)),
    mergeMap(([ action, state ]) => {
      if (!state.isReady) return EMPTY;
      const { participantId, itemId } = action.id;
      const matchingNotifications = state.data.filter(n =>
        isForumNewMessageNotification(n) &&
        n.payload.participantId === participantId &&
        n.payload.itemId === itemId
      );
      return from(matchingNotifications.map(n => n.sk));
    }),
    mergeMap(sk => notificationService.deleteNotification(sk).pipe(
      map(() => notificationApiActions.notificationDeleted({ sk })),
      catchError(() => of(notificationApiActions.notificationDeleted({ sk }))),
    )),
  ) : EMPTY),
  { functional: true }
);
