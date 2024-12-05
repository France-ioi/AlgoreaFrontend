import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { RootState } from 'src/app/utils/store/root_state';
import { State } from './current-content.state';

interface Selectors<T extends RootState> {
  selectBreadcrumbs: MemoizedSelector<T, State['breadcrumbs']>,
  selectTitle: MemoizedSelector<T, State['title']>,
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

  return {
    selectBreadcrumbs,
    selectTitle,
  };
}
