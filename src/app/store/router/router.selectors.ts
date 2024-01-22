import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './router.state';
import { Params, convertToParamMap } from '@angular/router';
import { RouterReducerState } from '@ngrx/router-store';

interface Selectors<T> {
  /** override the auto-generated selectors as there do not handle correctly the fact that the state is `undefined` at app launch */
  selectRouterState: MemoizedSelector<T, RouterReducerState<State> | undefined>,
  selectState: MemoizedSelector<T, State | undefined>,
  selectNavigationId: MemoizedSelector<T, RouterReducerState['navigationId'] | undefined>,
  /** extra ones */
  selectQueryParam: (param: string) => MemoizedSelector<T, string | null>,
}

export function selectors<T>(baseSelectRouterState: Selector<T, RouterReducerState<State>>): Selectors<T> {
  const selectRouterState = createSelector(
    baseSelectRouterState,
    routerState => (routerState !== undefined ? routerState : undefined)
  );
  const selectState = createSelector(
    selectRouterState,
    routerState => routerState?.state
  );

  const selectNavigationId = createSelector(
    selectRouterState,
    routerState => routerState?.navigationId
  );

  const emptyParams: Params = [];
  const selectQueryParams = createSelector(
    selectState,
    state => (state ? state.queryParams : emptyParams)
  );
  const selectQueryParamMap = createSelector(
    selectQueryParams,
    params => convertToParamMap(params)
  );
  const selectQueryParam = (param: string): MemoizedSelector<T, string | null> =>
    createSelector(selectQueryParamMap, paramMap => paramMap.get(param));

  return { selectRouterState, selectState, selectNavigationId, selectQueryParam };
}
