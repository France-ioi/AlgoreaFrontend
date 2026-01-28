import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { filter, map, switchMap } from 'rxjs';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { eventFetchingActions } from './event-fetching.actions';
import { convertActivityLogsToThreadEvents, convertThreadMessageToThreadEvents } from '../../models/thread-events-conversions';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const logEventFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    activityLogService = inject(ActivityLogService),
  ) => store$.select(fromForum.selectThreadId).pipe(
    filter(isNotNull),
    switchMap(threadId => activityLogService.getThreadActivityLog(threadId, { limit: 11 }).pipe(
      map(convertActivityLogsToThreadEvents),
      mapToFetchState(),
    )),
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
    switchMap(thread => threadMessageService.getAll(thread.itemId, thread.participantId,{ authToken: thread.token, limit: 11 }).pipe(
      map(convertThreadMessageToThreadEvents),
      mapToFetchState(),
    )),
    map(fetchState => eventFetchingActions.slsEventsFetchStateChanged({ fetchState })),
  ),
  { functional: true }
);
