import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, combineLatest, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { fromItemContent } from './item-content.store';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { fromObservation } from 'src/app/store/observation';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { itemFetchingActions } from './item-content.actions';
import { ItemBreadcrumbsWithFailoverService } from '../../services/item-breadcrumbs-with-failover.service';
import { ResultFetchingService, canFetchResults } from '../../services/result-fetching.service';
import { routesEqualIgnoringCommands } from 'src/app/models/routing/item-route';

export const itemFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    getItemByIdService = inject(GetItemByIdService),
  ) => store$.select(fromItemContent.selectActiveContentId).pipe(
    // Only do something for non-null item id (so on item page) so that we keep the item data when navigating to another type of page
    // (e.g., group). If we come back on the same item later, there is no more refetch needed.
    switchMap(id => (isNotNull(id) ?
      combineLatest({ id: of(id), observedGroupId: store$.select(fromObservation.selectObservedGroupId) }) : EMPTY
    )),
    distinctUntilChanged((prev, cur) => prev.id === cur.id && prev.observedGroupId === cur.observedGroupId),
    switchMap(({ id, observedGroupId }) => getItemByIdService.get(id, observedGroupId ?? undefined).pipe(
      mapToFetchState({ resetter: actions$.pipe(ofType(fromItemContent.itemByIdPageActions.refresh)) })
    )),
    map(fetchState => itemFetchingActions.itemFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);

export const breadcrumbsFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    breadcrumbsService = inject(ItemBreadcrumbsWithFailoverService),
  ) => store$.select(fromItemContent.selectActiveContentRoute).pipe(
    filter(isNotNull),
    distinctUntilChanged(routesEqualIgnoringCommands), // do not refetch if coming back on the same content
    switchMap(route => breadcrumbsService.get(route).pipe(
      mapToFetchState({ resetter: actions$.pipe(ofType(fromItemContent.itemByIdPageActions.refresh)) })
    )),
    map(fetchState => itemFetchingActions.breadcrumbsFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);

export const resultsFetchingEffect = createEffect(
  (
    store$ = inject(Store),
    actions$ = inject(Actions),
    resultFetchingService = inject(ResultFetchingService),
  ) => store$.select(fromItemContent.selectActiveContentInfoForFetchingResults).pipe(
    filter(isNotNull),
    distinctUntilChanged((x, y) => routesEqualIgnoringCommands(x.route, y.route)),
    switchMap(({ route, item }) => {
      if (!canFetchResults(item)) return of(null);
      return resultFetchingService.fetchResults(route, item).pipe(
        mapToFetchState({ resetter: actions$.pipe(ofType(fromItemContent.itemByIdPageActions.refresh)) })
      );
    }),
    map(fetchState => itemFetchingActions.resultsFetchStateChanged({ fetchState })),
  ),
  { functional: true },
);
