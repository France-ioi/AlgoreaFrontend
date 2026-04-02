import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './community.state';
import { communityActivityFeedActions, communityPollActions, communityStatsApiActions } from './community.actions';
import { contentPageActions } from 'src/app/store/navigation/current-content/current-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    communityPollActions.pollResultReceived,
    (state, { hasNew }): State => ({ ...state, hasUnreadThreads: hasNew })
  ),

  on(
    contentPageActions.changeContent,
    (state, { route }): State => (route === 'community' ? { ...state, hasUnreadThreads: false } : state)
  ),

  on(
    communityActivityFeedActions.opened,
    (state): State => ({ ...state, activityFeedActive: true })
  ),

  on(
    communityActivityFeedActions.closed,
    (state): State => ({ ...state, activityFeedActive: false })
  ),

  on(
    communityStatsApiActions.fetchStateChanged,
    (state, { fetchState }): State => ({ ...state, statsState: fetchState })
  ),
);
