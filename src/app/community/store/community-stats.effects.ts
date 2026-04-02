import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect } from '@ngrx/effects';
import { EMPTY, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { GetCommunityStatsService } from '../data-access/get-community-stats.service';
import { communityStatsApiActions } from './community.actions';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { SECONDS } from 'src/app/utils/duration';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

const REFRESH_INTERVAL = 60*SECONDS;

export const communityStatsFetchEffect = createEffect(
  (
    store = inject(Store),
    getCommunityStatsService = inject(GetCommunityStatsService),
  ) => store.select(fromCurrentContent.selectRoute).pipe(
    map(route => route === 'community'),
    distinctUntilChanged(),
    switchMap(isCommunityPage => (isCommunityPage
      ? timer(0, REFRESH_INTERVAL).pipe(
        switchMap(() => getCommunityStatsService.get().pipe(
          mapToFetchState(),
        )),
        map(fetchState => communityStatsApiActions.fetchStateChanged({ fetchState })),
      )
      : EMPTY
    )),
  ),
  { functional: true },
);
