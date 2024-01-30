import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs';
import { GetUserService } from '../../data-access/get-user.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { breadcrumbsFetchedActions, userInfoFetchedActions, userPageActions } from './user-content.actions';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { GetGroupBreadcrumbsService } from '../../data-access/get-group-breadcrumbs.service';
import { fromUserContent } from './user-content.store';

export const fetchUserInfoEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userService = inject(GetUserService)
  ) => store$.select(fromUserContent.selectActiveContentUserId).pipe(
    filter(isNotNull),
    switchMap(id => userService.getForId(id).pipe(mapToFetchState({ resetter: actions$.pipe(ofType(userPageActions.refresh)) }))),
    map(fetchState => userInfoFetchedActions.fetchStateChanged({ fetchState }))
  ),
  { functional: true }
);

export const fetchBreadcrumbsEffect = createEffect(
  (
    store$ = inject(Store),
    breadcrumbsService = inject(GetGroupBreadcrumbsService),
  ) => store$.select(fromUserContent.selectActiveContentUserFullRoute).pipe(
    filter(isNotNull),
    switchMap(route => breadcrumbsService.getBreadcrumbs(route).pipe(mapToFetchState())),
    map(fetchState => breadcrumbsFetchedActions.fetchStateChanged({ fetchState }))
  ),
  { functional: true }
);
