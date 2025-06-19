import { createReducer, on } from '@ngrx/store';
import {
  groupInfoFetchedActions,
  routerActions,
} from './observation.actions';
import { State, initialState } from './observation.state';

export const reducer = createReducer(
  initialState,

  on(
    routerActions.disableObservation,
    (state): State => ({ ...state, group: null })
  ),

  on(groupInfoFetchedActions.fetchStateChanged,
    (state, { route, fetchState }): State => (route.id === state.group?.route.id ?
      { ...state, group: { route, info: fetchState } } :
      state /* keep state unchanged if the action is not about the current observed group */
    ),
  ),

);
