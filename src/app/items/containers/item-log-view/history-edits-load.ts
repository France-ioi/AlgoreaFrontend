import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { ActivityLogService, ActivityLogs } from 'src/app/data-access/activity-log.service';
import { Task } from 'src/app/items/api/task-proxy';
import { TaskHistory } from 'src/app/items/api/types';
import { errorState, FetchState, readyState } from 'src/app/utils/state';
import { HistoryEditsPager, historyEditsFetchSize } from './history-edits-pager';
import { HistoryListRow } from './history-list-merge';

export function fetchAttemptActivityLog(
  activityLogService: ActivityLogService,
  itemId: string,
  attemptId: string,
  observedGroupId: string | null,
  latestRow?: ActivityLogs[number],
): Observable<ActivityLogs> {
  const pagination = latestRow === undefined ? undefined : {
    fromItemId: latestRow.item.id,
    fromParticipantId: latestRow.participant.id,
    fromAttemptId: latestRow.attemptId,
    fromAnswerId: latestRow.answerId ?? '0',
    fromActivityType: latestRow.activityType,
  };
  return activityLogService.getActivityLog(itemId, {
    limit: historyEditsFetchSize,
    pagination,
    watchedGroupId: observedGroupId ?? undefined,
    attemptId,
  });
}

/** Activity log for Events only: every attempt, not filtered. */
export function fetchAllActivityLog(
  activityLogService: ActivityLogService,
  itemId: string,
  observedGroupId$: Observable<string | null>,
  pageSize: number,
  latestRow?: ActivityLogs[number],
): Observable<ActivityLogs> {
  return observedGroupId$.pipe(
    switchMap(observedGroupId => activityLogService.getActivityLog(itemId, {
      limit: pageSize,
      pagination: latestRow === undefined ? undefined : {
        fromItemId: latestRow.item.id,
        fromParticipantId: latestRow.participant.id,
        fromAttemptId: latestRow.attemptId,
        fromAnswerId: latestRow.answerId ?? '0',
        fromActivityType: latestRow.activityType,
      },
      watchedGroupId: observedGroupId ?? undefined,
    })),
  );
}

export function fetchAttemptActivityLog$(
  activityLogService: ActivityLogService,
  itemId: string,
  attemptId: string,
  observedGroupId$: Observable<string | null>,
  latestRow?: ActivityLogs[number],
): Observable<ActivityLogs> {
  return observedGroupId$.pipe(
    take(1),
    switchMap(observedGroupId =>
      fetchAttemptActivityLog(activityLogService, itemId, attemptId, observedGroupId, latestRow)
    ),
  );
}

export interface EditsListData {
  rows: HistoryListRow[],
  canLoadMore: boolean,
}

function keepEvent(profileId: string): (log: ActivityLogs[number]) => boolean {
  return (log): boolean => !(log.activityType === 'current_answer' && log.participant.id === profileId);
}

export function loadEditsFirstPage(options: {
  pager: HistoryEditsPager,
  task: Task,
  fetchEvents: () => Observable<ActivityLogs>,
  profileId$: Observable<string>,
}): Observable<FetchState<EditsListData>> {
  options.pager.reset();
  return forkJoin({
    events: options.fetchEvents(),
    checkpoints: options.task.getHistory({ onlyCheckpoints: true, limit: historyEditsFetchSize }),
    profileId: options.profileId$.pipe(take(1)),
  }).pipe(
    map(({ events, checkpoints, profileId }) => {
      const merged = options.pager.setFirstPages(events, checkpoints, keepEvent(profileId));
      return readyState({ rows: merged.rows, canLoadMore: merged.canLoadMore });
    }),
    catchError(err => of(errorState(err))),
  );
}

export function loadEditsNextPage(options: {
  pager: HistoryEditsPager,
  task: Task,
  fetchEvents: (latest?: ActivityLogs[number]) => Observable<ActivityLogs>,
  profileId$: Observable<string>,
}): Observable<FetchState<EditsListData> | null> {
  const hints = options.pager.merge();
  if (!hints.canLoadMore || (!hints.fetchMoreEvents && !hints.fetchMoreCheckpoints)) {
    return of(null);
  }

  const requests: { events?: Observable<ActivityLogs>, checkpoints?: Observable<TaskHistory> } = {};
  if (hints.fetchMoreEvents) {
    requests.events = options.fetchEvents(options.pager.latestEvent());
  }
  if (hints.fetchMoreCheckpoints) {
    const maxId = options.pager.nextCheckpointsMaxId();
    requests.checkpoints = options.task.getHistory({
      onlyCheckpoints: true,
      limit: historyEditsFetchSize,
      ...(maxId !== undefined ? { maxId } : {}),
    });
  }
  if (requests.events === undefined && requests.checkpoints === undefined) {
    return of(null);
  }

  return forkJoin({
    pages: forkJoin(requests),
    profileId: options.profileId$.pipe(take(1)),
  }).pipe(
    map(({ pages, profileId }) => {
      const merged = options.pager.appendPages(pages, keepEvent(profileId));
      return readyState({ rows: merged.rows, canLoadMore: merged.canLoadMore });
    }),
    catchError(err => of(errorState(err))),
  );
}
