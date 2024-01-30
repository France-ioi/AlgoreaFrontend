import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs';
import { selectActiveContentUserId } from './user-content.selectors';
import { GetUserService } from '../../data-access/get-user.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { userInfoFetchedActions, userPageActions } from './user-content.actions';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const fetchUserInfoEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userService = inject(GetUserService)
  ) => store$.select(selectActiveContentUserId).pipe(
    filter(isNotNull),
    switchMap(id => userService.getForId(id).pipe(mapToFetchState({ resetter: actions$.pipe(ofType(userPageActions.refresh)) }))),
    map(fetchState => userInfoFetchedActions.fetchStateChanged({ fetchState }))
  ),
  { functional: true }
);
