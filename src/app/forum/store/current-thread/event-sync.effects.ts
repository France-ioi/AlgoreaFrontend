import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { areSameThreads } from '../../models/threads';
import { ForumWebsocketClient } from '../../data-access/forum-websocket-client.service';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { readyData } from 'src/app/utils/operators/state';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { publishEventsAction } from '../../data-access/websocket-messages/threads-outbound-actions';

/**
 * Synchronization of the events in the forum thread with the events from the backend
 */
export const syncEventsEffect = createEffect(
  (
    actions$ = inject(Actions),
    activityLogService = inject(ActivityLogService),
    websocketClient = inject(ForumWebsocketClient),
  ) => actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChange),
    map(({ fetchState }) => fetchState),
    readyData(),
    distinctUntilChanged(areSameThreads),
    map(({ itemId, participantId, isMine, token }) => ({ itemId, token, watchedGroupId: isMine ? undefined : participantId })),
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
  ),
  { functional: true, dispatch: false }
);
