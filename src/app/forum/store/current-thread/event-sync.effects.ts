import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { EMPTY, OperatorFunction, distinctUntilChanged, map, of, pipe, switchMap, take, tap } from 'rxjs';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { readyData } from 'src/app/utils/operators/state';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { publishEventsAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { itemPageEventSyncActions } from './event-sync.actions';
import { Store } from '@ngrx/store';
import forumFeature from '..';
import { Thread, areSameThreads } from '../../models/threads';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';

/**
 * Synchronization of the events from the backend with the forum
 */

function syncThread(activityLogService: ActivityLogService, websocketClient: WebsocketClient): OperatorFunction<Thread, unknown> {
  return pipe(
    switchMap(({ itemId, participantId, isMine, token, canWatch }) => {
      if (!isMine && !canWatch) return EMPTY; // will not be allowed to get the activity log, so do not sync
      return of({ itemId, token, watchedGroupId: isMine ? undefined : participantId });
    }),
    switchMap(({ itemId, token, watchedGroupId }) => activityLogService.getActivityLog(itemId, { watchedGroupId, limit: 100 }).pipe(
      map(log => log.map(e => {
        switch (e.activityType) {
          case 'result_started': return { label: 'result_started' as const, time: e.at.valueOf(), data: { attemptId: e.attemptId } };
          case 'submission': {
            if (!e.answerId) return null;
            const { attemptId, answerId, at, score } = e;
            return { label: 'submission' as const, time: at.valueOf(), data: { attemptId, answerId, score } };
          }
          default: return null;
        }
      }).filter(isNotNull)),
      map(log => ({ log, token })),
    )),
    tap(({ log, token }) => {
      websocketClient.send(publishEventsAction(token, log));
    }),
  );
}

export const syncOnThreadChangeEffect = createEffect(
  (
    actions$ = inject(Actions),
    activityLogService = inject(ActivityLogService),
    websocketClient = inject(WebsocketClient),
  ) => actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChanged),
    map(({ fetchState }) => fetchState),
    readyData(),
    distinctUntilChanged(areSameThreads),
    syncThread(activityLogService, websocketClient),
  ),
  { functional: true, dispatch: false }
);

export const forceSyncEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    activityLogService = inject(ActivityLogService),
    websocketClient = inject(WebsocketClient),
  ) => actions$.pipe(
    ofType(itemPageEventSyncActions.forceSyncCurrentThreadEvents),
    switchMap(() => store$.select(forumFeature.selectInfo).pipe(take(1))), // take the current info
    readyData(), // only if current info is ready
    syncThread(activityLogService, websocketClient),
  ),
  { functional: true, dispatch: false }
);
