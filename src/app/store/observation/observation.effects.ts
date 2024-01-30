import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { withLatestFrom, filter, map, switchMap, Observable, tap } from 'rxjs';
import { fromObservation } from './observation.store';
import { selectObservedGroupRouteFromRouter } from './router-observation.selectors';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { FetchedObservedGroupInfo, groupInfoFetchedActions, routerActions } from './observation.actions';
import { GetUserService } from 'src/app/groups/data-access/get-user.service';
import { GetGroupByIdService } from 'src/app/groups/data-access/get-group-by-id.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { cannotWatchError } from './utils/errors';
import { isUser } from 'src/app/models/routing/group-route';

/**
 * If the router has a observed group set (possibly 'none') AND it is different from the current one in the store, emit an
 * action to change observation
 */
export const observationRouteChanged = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(selectObservedGroupRouteFromRouter).pipe(
    filter(isNotUndefined),
    withLatestFrom(store$.select(fromObservation.selectObservedGroupId)),
    filter(([ fromRouter, idFromStore ]) => (fromRouter?.id ?? null) !== idFromStore),
    map(([ fromRouter ]) => (fromRouter ? routerActions.enableObservation({ route: fromRouter }) : routerActions.disableObservation())),
  ),
  { functional: true }
);

export const observationGroupFetching = createEffect(
  (
    actions$ = inject(Actions),
    userService = inject(GetUserService),
    groupService = inject(GetGroupByIdService),
  ) => actions$.pipe(
    ofType(routerActions.enableObservation),
    switchMap(({ route }) => (isUser(route) ? fetchUser(userService, route.id) : fetchGroup(groupService, route.id)).pipe(
      mapToFetchState(),
      map(fetchState => groupInfoFetchedActions.fetchStateChanged({ route, fetchState }))
    )),
  ),
  { functional: true }
);


//
// Utility functions (private)
//

function fetchUser(userService: GetUserService, id: string): Observable<FetchedObservedGroupInfo> {
  return userService.getForId(id).pipe(
    tap(user => {
      if (!user.currentUserCanWatchUser) throw cannotWatchError;
    }),
    map(user => ({
      name: user.login,
      currentUserCanGrantAccess: user.currentUserCanGrantUserAccess ?? false,
    })),
  );
}

function fetchGroup(groupService: GetGroupByIdService, id: string): Observable<FetchedObservedGroupInfo> {
  return groupService.get(id).pipe(
    tap(group => {
      if (!group.currentUserCanWatchMembers) throw cannotWatchError;
    }),
    map(g => ({
      name: g.name,
      currentUserCanGrantAccess: g.currentUserCanGrantGroupAccess ?? false,
    })),
  );
}
