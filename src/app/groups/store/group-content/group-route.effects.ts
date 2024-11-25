import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, startWith, switchMap } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { UserSessionService } from 'src/app/services/user-session.service';
import { repeatLatestWhen } from 'src/app/utils/operators/repeatLatestWhen';
import { mapErrorToState } from 'src/app/utils/operators/state';
import { fetchingState } from 'src/app/utils/state';
import { fromGroupContent } from './group-content.store';
import { solveMissingGroupPath } from '../../utils/group-route-validation';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { routeErrorHandlingActions } from './group-content.actions';
import { GetGroupPathService } from '../../data-access/get-group-path.service';

export const routeErrorHandlingEffect = createEffect(
  (
    store$ = inject(Store),
    userSessionService = inject(UserSessionService),
    getGroupPathService = inject(GetGroupPathService),
    groupRouter = inject(GroupRouter),
  ) => store$.select(fromGroupContent.selectActiveContentRouteError).pipe(
    // should only be set for non-users
    filter(isNotNull),
    repeatLatestWhen(userSessionService.userChanged$),
    switchMap(routeError => solveMissingGroupPath(routeError.id, getGroupPathService, groupRouter).pipe(
      startWith(fetchingState()),
      mapErrorToState(),
    )),
    map(newState => routeErrorHandlingActions.routeErrorHandlingChange({ newState }))
  ),
  { functional: true },
);
