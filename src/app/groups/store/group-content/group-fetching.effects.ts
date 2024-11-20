import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs';
import { GetUserService } from '../../data-access/get-user.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { groupInfoFetchedActions, groupPageActions, userPageActions } from './group-content.actions';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { GetGroupBreadcrumbsService } from '../../data-access/get-group-breadcrumbs.service';
import { fromGroupContent } from './group-content.store';
import { GetGroupByIdService } from '../../data-access/get-group-by-id.service';

export const fetchUserInfoEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userService = inject(GetUserService),
  ) => store$.select(fromGroupContent.selectActiveContentUserId).pipe(
    filter(isNotNull),
    switchMap(id => userService.getForId(id).pipe(mapToFetchState({
      resetter: actions$.pipe(ofType(userPageActions.refresh)),
      identifier: { id },
    }))),
    map(fetchState => groupInfoFetchedActions.userFetchStateChanged({ fetchState }))
  ),
  { functional: true }
);

export const fetchGroupInfoEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    groupService = inject(GetGroupByIdService),
  ) => store$.select(fromGroupContent.selectActiveContentGroupId).pipe(
    filter(isNotNull),
    switchMap(id => groupService.get(id).pipe(mapToFetchState({
      resetter: actions$.pipe(ofType(groupPageActions.refresh)),
      identifier: { id },
    }))),
    map(fetchState => groupInfoFetchedActions.groupFetchStateChanged({ fetchState }))
  ),
  { functional: true }
);

export const fetchBreadcrumbsEffect = createEffect(
  (
    store$ = inject(Store),
    breadcrumbsService = inject(GetGroupBreadcrumbsService),
  ) => store$.select(fromGroupContent.selectActiveContentFullRoute).pipe(
    filter(isNotNull),
    switchMap(route => breadcrumbsService.getBreadcrumbs(route).pipe(mapToFetchState({ identifier: route }))),
    map(fetchState => groupInfoFetchedActions.breadcrumbsFetchStateChanged({ fetchState }))
  ),
  { functional: true }
);
