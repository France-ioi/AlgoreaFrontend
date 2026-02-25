import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { distinctUntilChanged, EMPTY, map, switchMap } from 'rxjs';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { notificationApiActions, notificationTriggerActions } from './notification.actions';
import { UserSessionService } from 'src/app/services/user-session.service';
import { APPCONFIG } from 'src/app/config';

export const fetchNotificationsEffect = createEffect(
  (
    actions$ = inject(Actions),
    userSessionService = inject(UserSessionService),
    notificationService = inject(NotificationHttpService),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableNotifications ? userSessionService.userProfile$.pipe(
    distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId),
    switchMap(() => notificationService.getNotifications().pipe(
      mapToFetchState({
        resetter: actions$.pipe(ofType(notificationTriggerActions.refresh)),
      })
    )),
    map(fetchState => notificationApiActions.fetchStateChanged({ fetchState }))
  ) : EMPTY),
  { functional: true }
);
