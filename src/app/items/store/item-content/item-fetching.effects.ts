import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  skip,
  switchMap,
} from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { itemContentStore } from './item-content.store';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { itemByIdPageActions, itemFetchingActions, itemRouteErrorHandlingActions } from './item-content.actions';
import { ItemBreadcrumbsWithFailoverService } from '../../services/item-breadcrumbs-with-failover.service';
import { ResultFetchingService } from '../../services/result-fetching.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { FullItemRoute, resultsFetchKey } from 'src/app/models/routing/item-route';
import { ItemPath } from 'src/app/models/ids';
import { isArrayPrefix } from 'src/app/utils/array';
import equal from 'fast-deep-equal/es6';

// Results are chained from the root, so a start on a prefix creates results on the route's ancestors, and a start on an
// extension creates results on the route itself. Both change the breadcrumbs.
function startedPathAffectsRoute(startedPath: ItemPath, route: FullItemRoute): boolean {
  const routePath = [ ...route.path, route.id ];
  return isArrayPrefix(startedPath, routePath) || isArrayPrefix(routePath, startedPath);
}

const refreshTriggers = (
  refreshActions$: Observable<unknown>,
  userSessionService$: UserSessionService,
): Observable<unknown> => merge(
  refreshActions$,
  userSessionService$.userChanged$,
  userSessionService$.userProfile$.pipe(map(user => user.defaultLanguage), distinctUntilChanged(), skip(1)),
).pipe(
  debounceTime(0), // do not refresh more than one refresh per cycle
);

export const itemFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userSessionService$ = inject(UserSessionService),
    getItemByIdService = inject(GetItemByIdService),
  ) => store$.select(itemContentStore.selectActiveContentRoute).pipe(
    // Only do something for non-null item id (so on item page) so that we keep the item data when navigating to another type of page
    // (e.g., group). If we come back on the same item later, there is no more refetch needed.
    filter(isNotNull),
    distinctUntilChanged((prev, cur) => prev.id === cur.id && prev.observedGroup?.id === cur.observedGroup?.id),
    switchMap(route => getItemByIdService.get(route.id, route.observedGroup ? { watchedGroupId: route.observedGroup.id } : {}).pipe(
      mapToFetchState({
        resetter: refreshTriggers(actions$.pipe(ofType(itemByIdPageActions.refresh)), userSessionService$),
        identifier: { id: route.id, observedGroup: route.observedGroup },
      })
    )),
    map(fetchState => itemFetchingActions.itemFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);

export const breadcrumbsFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userSessionService$ = inject(UserSessionService),
    breadcrumbsService = inject(ItemBreadcrumbsWithFailoverService),
  ) => store$.select(itemContentStore.selectActiveContentRoute).pipe(
    filter(isNotNull),
    distinctUntilChanged((prev, cur) => equal(prev, cur)),
    switchMap(route => breadcrumbsService.get(route).pipe(
      mapToFetchState({
        // Keep filter(isNotNull) before distinctUntilChanged so path recovery's null does not tear down this inner
        // subscription: the resetter still sees resultPathStarted. Moving filter(isNotNull) after distinctUntilChanged
        // would drop that trigger for an identical recovered URL. resultPathStarted can fire before delay(0) navigation,
        // so a breadcrumbs request for the stale overlapping route may start and then be cancelled; do not reorder
        // those operators to avoid that.
        resetter: refreshTriggers(
          merge(
            actions$.pipe(ofType(itemByIdPageActions.refresh)),
            actions$.pipe(
              ofType(itemRouteErrorHandlingActions.resultPathStarted),
              map(({ path }) => path),
              filter(startedPath => startedPathAffectsRoute(startedPath, route)),
            ),
          ),
          userSessionService$,
        ),
        identifier: route,
      })
    )),
    map(fetchState => itemFetchingActions.breadcrumbsFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);

export const resultsFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    userSessionService$ = inject(UserSessionService),
    resultFetchingService = inject(ResultFetchingService),
  ) => store$.select(itemContentStore.selectActiveContentInfoForFetchingResults).pipe(
    filter(isNotNull),
    distinctUntilChanged((prev, cur) =>
      equal(resultsFetchKey(prev.route), resultsFetchKey(cur.route))
      && prev.item.permissions.canView === cur.item.permissions.canView
    ),
    switchMap(({ route, item }) => resultFetchingService.fetchResults(route, item).pipe(
      mapToFetchState({
        resetter: refreshTriggers(actions$.pipe(ofType(itemByIdPageActions.refresh)), userSessionService$),
        identifier: resultsFetchKey(route),
      }),
    )),
    map(fetchState => itemFetchingActions.resultsFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);
