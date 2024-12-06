import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './group-content.state';
import { groupInfoFetchedActions, routeErrorHandlingActions } from './group-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    groupInfoFetchedActions.userFetchStateChanged,
    groupInfoFetchedActions.groupFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, groupState: fetchState })
  ),

  on(
    groupInfoFetchedActions.breadcrumbsFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, breadcrumbsState: fetchState })
  ),

  on(
    routeErrorHandlingActions.routeErrorHandlingChange,
    (state, { newState }): State => ({ ...state, routeErrorHandling: newState })
  ),

);
