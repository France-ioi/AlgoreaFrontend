import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './community.state';
import { communityPageActions, communityPollActions } from './community.actions';

export const reducer = createReducer(
  initialState,

  on(
    communityPollActions.pollResultReceived,
    (state, { hasNew }): State => ({ ...state, hasUnreadThreads: hasNew })
  ),

  on(
    communityPageActions.pageVisited,
    (state): State => ({ ...state, hasUnreadThreads: false })
  ),
);
