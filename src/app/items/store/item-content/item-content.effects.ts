import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { catchError, delay, EMPTY, filter, map, of, switchMap, tap } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { itemContentStore } from './item-content.store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { formatBreadcrumbs } from '../../models/item-breadcrumbs';
import { typeCategoryOfItem } from '../../models/item-type';
import { loadAnswerAsCurrentFromNavigationState } from 'src/app/models/routing/item-navigation-state';
import { itemRouteWith, resultsFetchKey } from 'src/app/models/routing/item-route';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { itemByIdPageActions, itemFetchingActions } from './item-content.actions';
import { errorState } from 'src/app/utils/state';

const selectCurrentContent = createSelector(
  itemContentStore.selectActiveContentRoute,
  itemContentStore.selectActiveContentBreadcrumbsState,
  itemContentStore.selectActiveContentItemState,
  (route, breadcrumbsState, itemState) => (route ? { route, breadcrumbs: breadcrumbsState.data, item: itemState.data } : null)
);

export const dispatchCurrentContentEffect = createEffect(
  (
    store$ = inject(Store),
    itemRouter = inject(ItemRouter),
  ) => store$.select(selectCurrentContent).pipe(
    filter(isNotNull),
    map(({ route, breadcrumbs, item }) => fromCurrentContent.contentPageActions.changeContent({
      route: route,
      breadcrumbs: breadcrumbs ? formatBreadcrumbs(breadcrumbs, itemRouter, item ? {
        category: typeCategoryOfItem(item),
        item,
      } : undefined) : undefined,
      title: item?.string.title ?? undefined,
    }))
  ),
  { functional: true },
);

// Not exported: `itemStoreEffects` spreads every export from this file as a FunctionalEffect.
const selectEnsureAttemptContext = createSelector(
  itemContentStore.selectActiveContentRoute,
  itemContentStore.selectAttemptResolution,
  (route, resolution) => (route !== null && resolution !== null ? { route, resolution } : null),
);

export const ensureAttemptInUrlEffect = createEffect(
  (
    store$ = inject(Store),
    itemRouter = inject(ItemRouter),
    resultActionsService = inject(ResultActionsService),
  ) => store$.select(selectEnsureAttemptContext).pipe(
    filter(isNotNull),
    // switchMap (not exhaustMap): a mid-start route change must cancel the stale start so we do not
    // navigate back to the previous route. Memoized selectEnsureAttemptContext already suppresses
    // duplicate emissions for a stable route.
    switchMap(({ route, resolution }) => {
      const navOpts = {
        navExtras: { replaceUrl: true },
        loadAnswerIdAsCurrent: loadAnswerAsCurrentFromNavigationState(),
      } as const;

      if (resolution.kind === 'pick') {
        return of(itemRouteWith(route, { attemptId: resolution.attemptId })).pipe(
          delay(0), // required to trigger a new navigation after the current one (as in `solveRouteError`)
          tap(normalized => itemRouter.navigateTo(normalized, navOpts)),
        );
      }

      const parentAttemptId = route.parentAttemptId;
      if (parentAttemptId === undefined) return EMPTY;
      return resultActionsService.start(route.path.concat([ route.id ]), parentAttemptId).pipe(
        tap(result => store$.dispatch(itemByIdPageActions.attemptStarted({ result }))),
        delay(0),
        tap(result => itemRouter.navigateTo(itemRouteWith(route, { attemptId: result.attemptId }), navOpts)),
        // Mirror mapToFetchState: keep the effect alive and put results into errorState so
        // selectAttemptResolution returns null (stops re-triggering start) and the item page shows the error.
        catchError(err => {
          store$.dispatch(itemFetchingActions.resultsFetchStateChanged({
            fetchState: errorState(err, resultsFetchKey(route)),
          }));
          return EMPTY;
        }),
      );
    }),
  ),
  { functional: true, dispatch: false },
);
