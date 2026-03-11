import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './community.state';
import { RootState } from 'src/app/utils/store/root_state';

interface CommunitySelectors<T extends RootState> {
  selectHasUnreadThreads: MemoizedSelector<T, boolean>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): CommunitySelectors<T> {
  const selectHasUnreadThreads = createSelector(
    selectState,
    state => state.hasUnreadThreads
  );

  return {
    selectHasUnreadThreads,
  };
}
