import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { filter, map, pairwise, startWith, switchMap } from 'rxjs';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { eventFetchingActions } from './event-fetching.actions';
import { convertActivityLogsToThreadEvents, convertThreadMessageToThreadEvents } from '../../models/thread-events-conversions';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';
import { areSameThreads } from '../../models/threads';

/**
 * Fetch log events when:
 * - A new thread becomes visible (thread ID changes)
 * - The panel is re-opened for the same thread (visibility changes to true)
 */
export const logEventFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    activityLogService = inject(ActivityLogService),
  ) => store$.select(fromForum.selectCurrentThread).pipe(
    startWith(null),
    pairwise(),
    filter(([ prev, curr ]) => {
      if (!curr?.visible || !curr.id) return false;
      // Emit when: new thread OR visibility just became true for same thread
      const isNewThread = !prev?.id || !areSameThreads(prev.id, curr.id);
      const isReopened = prev?.id && !prev.visible && areSameThreads(prev.id, curr.id);
      return isNewThread || !!isReopened;
    }),
    map(([ , curr ]) => curr!.id!),
    switchMap(threadId => activityLogService.getThreadActivityLog(threadId, { limit: 11 }).pipe(
      map(convertActivityLogsToThreadEvents),
      mapToFetchState({ identifier: threadId }),
    )),
    map(fetchState => eventFetchingActions.logEventsFetchStateChanged({ fetchState })),
  ),
  { functional: true }
);

/**
 * Fetch SLS events when:
 * - Thread info becomes ready for a visible thread
 * - The panel is re-opened for the same thread (visibility changes to true)
 */
export const slsEventFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    threadMessageService = inject(ThreadMessageService),
  ) => store$.select(fromForum.selectCurrentThread).pipe(
    startWith(null),
    pairwise(),
    filter(([ prev, curr ]) => {
      if (!curr?.visible || !curr.id || !curr.info.isReady) return false;
      // Emit when: new thread with ready info OR visibility just became true for same thread with ready info
      const prevId = prev?.id;
      const isNewThread = !prevId || !areSameThreads(prevId, curr.id);
      const isReopened = prevId && !prev.visible && areSameThreads(prevId, curr.id);
      const infoJustBecameReady = prevId && areSameThreads(prevId, curr.id) && !prev.info.isReady;
      return isNewThread || !!isReopened || !!infoJustBecameReady;
    }),
    map(([ , curr ]) => ({ id: curr!.id!, thread: curr!.info.data! })),
    switchMap(({ id, thread }) => {
      const { itemId, participantId, token } = thread;
      return threadMessageService.getAll(itemId, participantId, { authToken: token, limit: 11 }).pipe(
        map(convertThreadMessageToThreadEvents),
        mapToFetchState({ identifier: id }),
      );
    }),
    map(fetchState => eventFetchingActions.slsEventsFetchStateChanged({ fetchState })),
  ),
  { functional: true }
);
