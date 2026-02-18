import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { fromRouter } from 'src/app/store/router';
import { RootState } from 'src/app/utils/store/root_state';
import { FullItemRoute, ItemRoute } from 'src/app/models/routing/item-route';
import { Breadcumbs, Item, Results, State, initialState } from './item-content.state';
import { FetchState, errorState, fetchingState, readyState } from 'src/app/utils/state';
import { ItemData } from '../../models/item-data';
import equal from 'fast-deep-equal/es6';
import { Result } from '../../models/attempts';
import { isItemRouteError, ItemRouteError, parseItemUrlSegments } from 'src/app/models/routing/item-route-serialization';
import { fromConfig } from 'src/app/store/config';

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
   * If the content is an item, the current page
   */
  selectActiveContentPage: MemoizedSelector<T, string[]|null>,
  /**
   * If the content is an item: the item id.
   * Warning: this may return an id even when the route is in error state
   */
  selectActiveContentId: MemoizedSelector<T, string|null>,
  /**
   * If the active content is an item: the observed group.
   * `undefined` if not observing
   * `null` if there is no active item
   */
  selectActiveContentObservedGroup: MemoizedSelector<T, ItemRoute['observedGroup']|null>,
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

  const selectActiveContentRouteParsingResult = createSelector(
    fromRouter.selectSegments,
    fromConfig.selectRedirects,
    (segments, redirects) => (segments ? parseItemUrlSegments(segments, redirects) : null)
  );

  const selectActiveContentRouteParsingResultRoute = createSelector(
    selectActiveContentRouteParsingResult,
    result => (result ? result.route: null)
  );

  const selectActiveContentPage = createSelector(
    selectActiveContentRouteParsingResult,
    result => (result ? result.page: null)
  );

  const selectIsItemContentActive = createSelector(
    selectActiveContentRouteParsingResult,
    result => result !== null
  );

  const selectActiveContentRouteError = createSelector(
    selectActiveContentRouteParsingResultRoute,
    route => (route && isItemRouteError(route) ? route : null)
  );

  const selectActiveContentRouteErrorHandlingState = createSelector(
    selectState,
    selectActiveContentRouteError,
    (state, error) => (error !== null ? state.routeErrorHandling : null)
  );

  const selectActiveContentRoute = createSelector(
    selectActiveContentRouteParsingResultRoute,
    route => (route && !isItemRouteError(route) ? route : null)
  );

  const selectActiveContentId = createSelector(
    selectActiveContentRouteParsingResultRoute,
    route => (route ? route.id ?? null : null)
  );

  const selectActiveContentObservedGroup = createSelector(
    selectActiveContentRouteParsingResultRoute,
    route => (route ? route.observedGroup : null)
  );

  const selectActiveContentItemState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ itemState }, route) =>
      (route && equal(itemState.identifier, { id: route.id, observedGroup: route.observedGroup }) ? itemState : initialState.itemState)
  );

  const selectActiveContentBreadcrumbsState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ breadcrumbsState }, route) =>
      (equal(route, breadcrumbsState.identifier) ?
        breadcrumbsState : initialState.breadcrumbsState)
  );

  const selectActiveContentResultsState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ resultsState }, route) => (equal(route, resultsState?.identifier) ?
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
    selectActiveContentPage,
    selectActiveContentId,
    selectActiveContentObservedGroup,
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
