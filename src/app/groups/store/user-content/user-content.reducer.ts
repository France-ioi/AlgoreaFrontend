import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './user-content.state';
import { userInfoFetchedActions } from './user-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    userInfoFetchedActions.fetchStateChanged,
    (state, { fetchState }): State => ({ ...state, user: fetchState })
  ),

);
