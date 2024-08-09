import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map, merge, of, skip, switchMap } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { fromItemContent } from './item-content.store';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { fromObservation } from 'src/app/store/observation';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { itemByIdPageActions, itemFetchingActions } from './item-content.actions';
import { ItemBreadcrumbsWithFailoverService } from '../../services/item-breadcrumbs-with-failover.service';
import { ResultFetchingService, canFetchResults } from '../../services/result-fetching.service';
import { routesEqualIgnoringCommands } from 'src/app/models/routing/item-route';
import { UserSessionService } from 'src/app/services/user-session.service';

const refreshTriggers = (actions$: Actions<any>, userSessionService$: UserSessionService): Observable<unknown> => merge(
  actions$.pipe(ofType(itemByIdPageActions.refresh)),
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
  ) => store$.select(fromItemContent.selectActiveContentId).pipe(
    // Only do something for non-null item id (so on item page) so that we keep the item data when navigating to another type of page
    // (e.g., group). If we come back on the same item later, there is no more refetch needed.
    switchMap(id => (isNotNull(id) ?
      combineLatest({ id: of(id), observedGroupId: store$.select(fromObservation.selectObservedGroupId) }) : EMPTY
    )),
    distinctUntilChanged((prev, cur) => prev.id === cur.id && prev.observedGroupId === cur.observedGroupId),
    switchMap(({ id, observedGroupId }) => getItemByIdService.get(id, observedGroupId ?? undefined).pipe(
      mapToFetchState({
        resetter: refreshTriggers(actions$, userSessionService$),
        identifier: { id, observedGroupId }
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
  ) => store$.select(fromItemContent.selectActiveContentRoute).pipe(
    filter(isNotNull),
    distinctUntilChanged(routesEqualIgnoringCommands), // do not refetch if coming back on the same content
    switchMap(route => breadcrumbsService.get(route).pipe(
      mapToFetchState({
        resetter: refreshTriggers(actions$, userSessionService$),
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
  ) => store$.select(fromItemContent.selectActiveContentInfoForFetchingResults).pipe(
    filter(isNotNull),
    distinctUntilChanged((x, y) => routesEqualIgnoringCommands(x.route, y.route)),
    switchMap(({ route, item }) => {
      if (!canFetchResults(item)) return of(null);
      return resultFetchingService.fetchResults(route, item).pipe(
        mapToFetchState({
          resetter: refreshTriggers(actions$, userSessionService$),
          identifier: route,
        })
      );
    }),
    map(fetchState => itemFetchingActions.resultsFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);
