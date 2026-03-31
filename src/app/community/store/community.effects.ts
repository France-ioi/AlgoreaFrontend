import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect } from '@ngrx/effects';
import { EMPTY, catchError, map, of, switchMap, timer } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { GetThreadsService } from 'src/app/data-access/get-threads.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { CommunityVisitService } from '../community-visit.service';
import { communityPollActions } from './community.actions';
import { fromCommunity } from './community.store';

const INITIAL_DELAY = 3000; // 3 seconds
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const communityPollEffect = createEffect(
  (
    config = inject(APPCONFIG),
    store = inject(Store),
    getThreadsService = inject(GetThreadsService),
    communityVisitService = inject(CommunityVisitService),
    userSessionService = inject(UserSessionService),
  ) => (config.featureFlags.community === 'enabled' ? userSessionService.userProfile$.pipe(
    switchMap(profile => {
      if (profile.tempUser) return EMPTY;
      return store.select(fromCommunity.selectHasUnreadThreads).pipe(
        switchMap(hasUnread => (hasUnread ? EMPTY : timer(INITIAL_DELAY, POLL_INTERVAL))),
        switchMap(() => {
          const lastVisited = communityVisitService.lastVisited();
          return getThreadsService.get(undefined, { isMine: false }).pipe(
            map(threads => {
              const pending = threads.filter(t => t.status === 'waiting_for_trainer');
              const hasNew = lastVisited
                ? pending.some(t => t.latestUpdateAt > new Date(lastVisited))
                : pending.length > 0;
              return communityPollActions.pollResultReceived({ hasNew });
            }),
            catchError(() => of(communityPollActions.pollResultReceived({ hasNew: false }))),
          );
        }),
      );
    }),
  ) : EMPTY),
  { functional: true }
);
