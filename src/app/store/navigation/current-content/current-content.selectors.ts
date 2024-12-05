import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { RootState } from 'src/app/utils/store/root_state';
import { State } from './current-content.state';
import { isString } from 'src/app/utils/type-checkers';
import { ContentRoute } from 'src/app/models/routing/content-route';

interface Selectors<T extends RootState> {
  selectBreadcrumbs: MemoizedSelector<T, State['breadcrumbs']>,
  selectTitle: MemoizedSelector<T, State['title']>,
  /**
   * Return the current content route or null if the current route is not a content route.
   */
  selectContentRoute: MemoizedSelector<T, ContentRoute|null>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): Selectors<T> {

  const selectBreadcrumbs = createSelector(
    selectState,
    state => state.breadcrumbs
  );

  const selectTitle = createSelector(
    selectState,
    state => state.title
  );

  const selectContentRoute = createSelector(
    selectState,
    ({ route }) => (!isString(route) ? route : null)
  );

  return {
    selectBreadcrumbs,
    selectTitle,
    selectContentRoute
  };
}
