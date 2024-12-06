import { MemoizedSelector, Selector, createSelector, createSelectorFactory, resultMemoize } from '@ngrx/store';
import { fromRouter } from 'src/app/store/router';
import { RootState } from 'src/app/utils/store/root_state';
import { FullItemRoute, itemCategoryFromPrefix, routesEqualIgnoringCommands } from 'src/app/models/routing/item-route';
import { ItemRouteError, isItemRouteError, itemRouteFromParams } from '../../utils/item-route-validation';
import { Breadcumbs, Item, Results, State, initialState } from './item-content.state';
import { equalNullishFactory } from 'src/app/utils/null-undefined-predicates';
import { FetchState, errorState, fetchingState, readyState } from 'src/app/utils/state';
import { ItemData } from '../../models/item-data';
import { fromObservation } from 'src/app/store/observation';
import equal from 'fast-deep-equal/es6';
import { Result } from '../../models/attempts';

interface UserContentSelectors<T extends RootState> {
  selectIsItemContentActive: MemoizedSelector<T, boolean>,
  /**
   * The route error, if any, of the current active content if it is an item
   * To be used by the effect which handles the error
   */
  selectActiveContentRouteError: MemoizedSelector<T, ItemRouteError|null>,
  /**
   * The state of route error handling (if there is an error)
   */
  selectActiveContentRouteErrorHandlingState: MemoizedSelector<T, State['routeErrorHandling']|null>,
  /**
   * If the content is an item and there is no route error: the fully defined route
   */
  selectActiveContentRoute: MemoizedSelector<T, FullItemRoute|null>,
  /**
   * If the content is an item and there is no route error: the item id
   */
  selectActiveContentId: MemoizedSelector<T, string|null>,
  selectActiveContentItemState: MemoizedSelector<T, State['itemState']>,
  selectActiveContentBreadcrumbsState: MemoizedSelector<T, State['breadcrumbsState']>,
  selectActiveContentResultsState: MemoizedSelector<T, State['resultsState']>,

  /**
   * The active item if we there is one and it has been fetched
   */
  selectActiveContentItem: MemoizedSelector<T, Item|null>,
  /**
   * The breadcrumbs of the active item if there is one and it has been fetched
   */
  selectActiveContentBreadcrumbs: MemoizedSelector<T, Breadcumbs|null>,
  /**
   * The results of the active item if there is one and it has been fetched
   */
  selectActiveContentResults: MemoizedSelector<T, Results|null>,
  /**
   * The current result of the active item if there is one and it has been fetched
   */
  selectActiveContentCurrentResult: MemoizedSelector<T, Result|null>,

  /**
   * Data that can be used for fetching results
   */
  selectActiveContentInfoForFetchingResults: MemoizedSelector<T, { route: FullItemRoute, item: ItemData['item'] }|null>,
  /**
   * The old structure for sharing the item data. Kept for now for compatibility reasons
   */
  selectActiveContentData: MemoizedSelector<T, FetchState<ItemData>|null>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): UserContentSelectors<T> {

  const selectActiveContentItemTypeCategory = createSelector(
    fromRouter.selectPath,
    path => (!!path && path.length >= 2 && path[0] ? itemCategoryFromPrefix(path[0]) : null),
  );

  const selectIsItemContentActive = createSelector(
    selectActiveContentItemTypeCategory,
    category => category !== null
  );

  const selectActiveContentParams = createSelector(
    selectActiveContentItemTypeCategory,
    fromRouter.selectParamMap,
    (category, paramMap) => (category ? { paramMap, category } : null)
  );

  const selectActiveContentRouteParsingResult = createSelector(
    selectActiveContentParams,
    params => (params ? itemRouteFromParams(params.category, params.paramMap) : null)
  );

  const selectActiveContentRouteError = createSelector(
    selectActiveContentRouteParsingResult,
    result => (result && isItemRouteError(result) ? result : null)
  );

  const selectActiveContentRouteErrorHandlingState = createSelector(
    selectState,
    selectActiveContentRouteError,
    (state, error) => (error !== null ? state.routeErrorHandling : null)
  );

  // The commands (e.g. `answer.loadAsCurrent`) in route parameters are transient and removed once parsed (to prevent replaying the action
  // on reload). We do not want the item content to consider that as a change, we keep the initial route.
  // eslint-disable-next-line @ngrx/prefix-selectors-with-select
  const createSelectorIgnoringRouteActionChanges = createSelectorFactory(
    projectionFn => resultMemoize(projectionFn, equalNullishFactory(routesEqualIgnoringCommands))
  // eslint-disable-next-line deprecation/deprecation
  ) as typeof createSelector; /* fix for ngrx non-type-safety on createSelectorFactory */

  const selectActiveContentRoute = createSelectorIgnoringRouteActionChanges(
    selectActiveContentRouteParsingResult,
    result => (result && !isItemRouteError(result) ? result : null)
  );

  const selectActiveContentId = createSelector(
    selectActiveContentRoute,
    route => (route ? route.id : null)
  );

  const selectActiveContentItemState = createSelector(
    selectState,
    selectActiveContentId,
    fromObservation.selectObservedGroupId,
    ({ itemState }, id, observedGroupId) => (equal(itemState.identifier, { id, observedGroupId }) ? itemState : initialState.itemState)
  );

  const selectActiveContentBreadcrumbsState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ breadcrumbsState }, route) =>
      (equalNullishFactory(routesEqualIgnoringCommands)(route, breadcrumbsState.identifier) ?
        breadcrumbsState : initialState.breadcrumbsState)
  );

  const selectActiveContentResultsState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ resultsState }, route) => (equalNullishFactory(routesEqualIgnoringCommands)(route, resultsState?.identifier) ?
      resultsState : initialState.resultsState)
  );

  const selectActiveContentItem = createSelector(
    selectActiveContentItemState,
    state => state.data ?? null
  );

  const selectActiveContentBreadcrumbs = createSelector(
    selectActiveContentBreadcrumbsState,
    state => state.data ?? null
  );

  const selectActiveContentResults = createSelector(
    selectActiveContentResultsState,
    state => state.data ?? null
  );

  const selectActiveContentCurrentResult = createSelector(
    selectActiveContentResults,
    results => results?.currentResult ?? null
  );

  const selectActiveContentInfoForFetchingResults = createSelector(
    selectActiveContentRoute,
    selectActiveContentItemState,
    selectActiveContentBreadcrumbsState,
    (route, itemState, breadcrumbsState) =>
      ((route !== null && itemState.isReady && breadcrumbsState.isReady) ? { route, item: itemState.data } : null)
  );

  const selectActiveContentData = createSelector(
    selectActiveContentRoute,
    selectActiveContentItemState,
    selectActiveContentBreadcrumbsState,
    selectActiveContentResultsState,
    (route, itemState, breadcrumbsState, resultsState) => {
      if (route === null) return null;
      if (itemState.isError) return errorState(itemState.error);
      if (breadcrumbsState.isError) return errorState(breadcrumbsState.error);
      if (itemState.isFetching || breadcrumbsState.isFetching) return fetchingState<ItemData>();
      return readyState<ItemData>({
        route,
        item: itemState.data,
        breadcrumbs: breadcrumbsState.data,
        results: resultsState.data?.results,
        currentResult: resultsState.data?.currentResult,
      });
    }
  );

  return {
    selectIsItemContentActive,
    selectActiveContentRouteError,
    selectActiveContentRouteErrorHandlingState,
    selectActiveContentRoute,
    selectActiveContentId,
    selectActiveContentItemState,
    selectActiveContentBreadcrumbsState,
    selectActiveContentResultsState,
    selectActiveContentItem,
    selectActiveContentBreadcrumbs,
    selectActiveContentResults,
    selectActiveContentCurrentResult,
    selectActiveContentInfoForFetchingResults,
    selectActiveContentData,
  };
}
