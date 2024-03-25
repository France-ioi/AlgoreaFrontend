import { MemoizedSelector, Selector, createSelector, createSelectorFactory, resultMemoize } from '@ngrx/store';
import { fromRouter } from 'src/app/store/router';
import { RootState } from 'src/app/utils/store/root_state';
import { FullItemRoute, itemCategoryFromPrefix, routesEqualIgnoringCommands } from 'src/app/models/routing/item-route';
import { ItemRouteError, isItemRouteError, itemRouteFromParams } from '../../utils/item-route-validation';
import { State } from './item-content.state';
import { equalNullableFactory } from 'src/app/utils/null-undefined-predicates';

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
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): UserContentSelectors<T> {

  const selectActiveContentItemTypeCategory = createSelector(
    fromRouter.selectPath,
    path => (!!path && path[0] ? itemCategoryFromPrefix(path[0]) : null),
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
    projectionFn => resultMemoize(projectionFn, equalNullableFactory(routesEqualIgnoringCommands))
  // eslint-disable-next-line deprecation/deprecation
  ) as typeof createSelector; /* fix for ngrx non-type-safety on createSelectorFactory */

  const selectActiveContentRoute = createSelectorIgnoringRouteActionChanges(
    selectActiveContentRouteParsingResult,
    result => (result && !isItemRouteError(result) ? result : null)
  );

  return {
    selectIsItemContentActive,
    selectActiveContentRouteError,
    selectActiveContentRouteErrorHandlingState,
    selectActiveContentRoute,
  };
}
