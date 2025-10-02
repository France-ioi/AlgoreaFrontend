import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { EMPTY, map, switchMap } from 'rxjs';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { Store } from '@ngrx/store';
import { UserSessionService } from 'src/app/services/user-session.service';
import { combineLatest } from 'rxjs';
import { fromForum } from '..';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { eventFetchingActions } from './event-fetching.actions';
import { convertActivityLogsToThreadEvents } from '../../models/thread-events-convertions';

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
