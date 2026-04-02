import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap } from 'rxjs';
import { GetCommunityStatsService } from '../data-access/get-community-stats.service';
import { communityPageActions, communityStatsApiActions } from './community.actions';
import { mapToFetchState } from 'src/app/utils/operators/state';

export const communityStatsFetchEffect = createEffect(
  (
    actions$ = inject(Actions),
    getCommunityStatsService = inject(GetCommunityStatsService),
  ) => actions$.pipe(
    ofType(communityPageActions.pageVisited),
    switchMap(() => getCommunityStatsService.get().pipe(
      mapToFetchState(),
    )),
    map(fetchState => communityStatsApiActions.fetchStateChanged({ fetchState })),
  ),
  { functional: true },
);
