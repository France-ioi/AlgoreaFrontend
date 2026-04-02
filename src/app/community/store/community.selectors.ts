import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './community.state';
import { RootState } from 'src/app/utils/store/root_state';
import { FetchState } from 'src/app/utils/state';
import { CommunityStats } from '../data-access/get-community-stats.service';

interface CommunitySelectors<T extends RootState> {
  selectHasUnreadThreads: MemoizedSelector<T, boolean>,
  selectActivityFeedActive: MemoizedSelector<T, boolean>,
  selectStatsState: MemoizedSelector<T, FetchState<CommunityStats>>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): CommunitySelectors<T> {
  const selectHasUnreadThreads = createSelector(
    selectState,
    state => state.hasUnreadThreads
  );

  const selectActivityFeedActive = createSelector(
    selectState,
    state => state.activityFeedActive
  );

  const selectStatsState = createSelector(
    selectState,
    state => state.statsState
  );

  return {
    selectHasUnreadThreads,
    selectActivityFeedActive,
    selectStatsState,
  };
}
