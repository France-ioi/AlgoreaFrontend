import { createReducer, on } from '@ngrx/store';
import { fetchingState, readyState } from 'src/app/utils/state';
import {
  groupInfoFetchedActions,
  routerActions,
  groupPageActions,
} from './observation.actions';
import { State, initialState } from './observation.state';

export const reducer = createReducer(
  initialState,

  on(
    routerActions.disableObservation,
    groupPageActions.hasLoadedAnNonObservableContent,
    (state): State => ({ ...state, group: null })
  ),

  on(
    groupPageActions.hasLoadedAnObservableContent,
    (state, { route, name, currentUserCanGrantAccess }): State => ({
      ...state,
      group: { route, info: readyState({ name, currentUserCanGrantAccess }) }
    })
  ),

  on(routerActions.enableObservation,
    (state, { route }): State => ({ ...state, group: { route, info: fetchingState() } }),
  ),

  on(groupInfoFetchedActions.fetchStateChanged,
    (state, { route, fetchState }): State => (route.id === state.group?.route.id ?
      { ...state, group: { route, info: fetchState } } :
      state /* keep state unchanged if the action is not about the current observed group */
    ),
  ),

);
