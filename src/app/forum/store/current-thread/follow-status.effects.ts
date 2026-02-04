import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { combineLatest, filter, map, switchMap, withLatestFrom, catchError, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { followStatusActions, followStatusUiActions } from './follow-status.actions';
import { threadPanelActions } from './current-thread.actions';
import { ThreadFollowService } from 'src/app/data-access/thread-follow.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { readyState } from 'src/app/utils/state';

/**
 * Fetch follow status when:
 * - Thread becomes visible AND
 * - Thread is open AND
 * - User is NOT the thread participant
 */
export const followStatusFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    followService = inject(ThreadFollowService),
    userSessionService = inject(UserSessionService),
  ) => combineLatest([
    store$.select(fromForum.selectThreadStatus),
    userSessionService.userProfile$,
  ]).pipe(
    filter(([ threadStatus, userProfile ]) => {
      if (!threadStatus?.visible || !threadStatus.open) return false;
      // Don't fetch if user is the participant (they always follow their own thread)
      if (threadStatus.id.participantId === userProfile.groupId) return false;
      return true;
    }),
    map(([ threadStatus ]) => threadStatus!.id),
    switchMap(threadId => followService.getFollowStatus(threadId.itemId, threadId.participantId).pipe(
      mapToFetchState(),
    )),
    map(fetchState => followStatusActions.fetchStateChanged({ fetchState })),
  ),
  { functional: true }
);

/**
 * Handle follow/unfollow toggle from UI
 */
export const followToggleEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    followService = inject(ThreadFollowService),
  ) => actions$.pipe(
    ofType(followStatusUiActions.followToggled),
    withLatestFrom(store$.select(fromForum.selectThreadToken)),
    filter(([ , token ]) => !!token),
    switchMap(([{ threadId, follow }, token ]) => {
      const request$ = follow
        ? followService.follow(threadId.itemId, threadId.participantId, { authToken: token! })
        : followService.unfollow(threadId.itemId, threadId.participantId);
      return request$.pipe(
        map(() => followStatusActions.fetchStateChanged({ fetchState: readyState(follow) })),
        catchError(() => EMPTY), // On error, don't update state (UI will still show old value)
      );
    }),
  ),
  { functional: true }
);

/**
 * Auto-follow when user sends a message (if not already following)
 */
export const autoFollowEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    followService = inject(ThreadFollowService),
  ) => actions$.pipe(
    ofType(threadPanelActions.autoFollowTriggered),
    withLatestFrom(store$.select(fromForum.selectFollowStatus), store$.select(fromForum.selectThreadToken)),
    filter(([ , followStatus, token ]) => followStatus.isReady && !followStatus.data && !!token),
    switchMap(([{ threadId }, , token ]) => followService.follow(threadId.itemId, threadId.participantId, { authToken: token! }).pipe(
      map(() => followStatusActions.fetchStateChanged({ fetchState: readyState(true) })),
      catchError(() => EMPTY),
    )),
  ),
  { functional: true }
);
