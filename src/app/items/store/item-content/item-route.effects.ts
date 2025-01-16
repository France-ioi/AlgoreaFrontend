import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, startWith, switchMap } from 'rxjs';
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
