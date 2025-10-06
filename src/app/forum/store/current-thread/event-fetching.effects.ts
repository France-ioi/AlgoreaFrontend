import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { EMPTY, map, switchMap } from 'rxjs';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { Store } from '@ngrx/store';
import { UserSessionService } from 'src/app/services/user-session.service';
import { combineLatest } from 'rxjs';
import { fromForum } from '..';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { eventFetchingActions } from './event-fetching.actions';
import { convertActivityLogsToThreadEvents, convertThreadMessageToThreadEvents } from '../../models/thread-events-convertions';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';

export const logEventFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    userSessionService = inject(UserSessionService),
    activityLogService = inject(ActivityLogService),
  ) => combineLatest([ store$.select(fromForum.selectThreadId), userSessionService.userProfile$ ]).pipe(
    switchMap(([ threadId, profile ]) => {
      if (!threadId) return EMPTY;
      const isMine = threadId.participantId === profile.groupId;
      const watchedGroupId = isMine ? undefined : threadId.participantId; // FIXME: will not work for teams
      return activityLogService.getActivityLog(threadId.itemId, { watchedGroupId, limit: 11 }).pipe(
        map(convertActivityLogsToThreadEvents),
        mapToFetchState(),
      );
    }),
    map(fetchState => eventFetchingActions.logEventsFetchStateChanged({ fetchState })),
  ),
  { functional: true }
);

export const slsEventFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    threadMessageService = inject(ThreadMessageService),
  ) => store$.select(fromForum.selectInfo).pipe(
    readyData(),
    switchMap(thread => threadMessageService.getAll({ authToken: thread.token, limit: 11 }).pipe(
      map(convertThreadMessageToThreadEvents),
      mapToFetchState(),
    )),
    map(fetchState => eventFetchingActions.slsEventsFetchStateChanged({ fetchState })),
  ),
  { functional: true }
);
