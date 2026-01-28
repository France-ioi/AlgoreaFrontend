import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { distinctUntilChanged, map, switchMap } from 'rxjs';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { notificationApiActions, notificationTriggerActions } from './notification.actions';
import { UserSessionService } from 'src/app/services/user-session.service';

export const fetchNotificationsEffect = createEffect(
  (
    actions$ = inject(Actions),
    userSessionService = inject(UserSessionService),
    notificationService = inject(NotificationHttpService),
  ) => userSessionService.userProfile$.pipe(
    distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId),
    switchMap(() => notificationService.getNotifications().pipe(
      mapToFetchState({
        resetter: actions$.pipe(ofType(notificationTriggerActions.refresh)),
      })
    )),
    map(fetchState => notificationApiActions.fetchStateChanged({ fetchState }))
  ),
  { functional: true }
);
