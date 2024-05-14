import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { delay, filter, map, startWith, switchMap, take, tap } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { fromItemContent } from './item-content.store';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { repeatLatestWhen } from 'src/app/utils/operators/repeatLatestWhen';
import { solveMissingPathAttempt } from '../../utils/item-route-validation';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { mapErrorToState } from 'src/app/utils/operators/state';
import { itemRouteErrorHandlingActions } from './item-content.actions';
import { fetchingState } from 'src/app/utils/state';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';

export const routeErrorHandlingEffect = createEffect(
  (
    store$ = inject(Store),
    userSessionService = inject(UserSessionService),
    getItemPathService = inject(GetItemPathService),
    resultActionsService = inject(ResultActionsService),
    itemRouter = inject(ItemRouter),
  ) => store$.select(fromItemContent.selectActiveContentRouteError).pipe(
    filter(isNotNull),
    repeatLatestWhen(userSessionService.userChanged$),
    switchMap(routeError => solveMissingPathAttempt(routeError, getItemPathService, resultActionsService, itemRouter).pipe(
      startWith(fetchingState()),
      mapErrorToState(),
    )),
    map(newState => itemRouteErrorHandlingActions.routeErrorHandlingChange({ newState }))
  ),
  { functional: true },
);

export const removeActionsFromRouteEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    itemRouter = inject(ItemRouter),
  ) => actions$.pipe(
    ofType(ROUTER_NAVIGATED), // only trigger this effect when a navigation has completed
    switchMap(() => store$.select(fromItemContent.selectActiveContentRoute).pipe(take(1))), // pick the current active content route
    filter(isNotNull),
    delay(0), // required in order to trigger new navigation after this one
    tap(route => {
      if (route.answer?.loadAsCurrent) itemRouter.navigateTo({ ...route, answer: undefined }, { navExtras: { replaceUrl: true } });
    })
  ),
  { functional: true, dispatch: false },
);
