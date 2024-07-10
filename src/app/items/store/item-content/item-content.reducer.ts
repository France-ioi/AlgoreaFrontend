import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './item-content.state';
import { itemFetchingActions, itemRouteErrorHandlingActions } from './item-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    itemRouteErrorHandlingActions.routeErrorHandlingChange,
    (state, { newState }): State => ({ ...state, routeErrorHandling: newState })
  ),

  on(
    itemFetchingActions.itemFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, item: fetchState })
  ),

  on(
    itemFetchingActions.breadcrumbsFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, breadcrumbs: fetchState })
  ),

  on(
    itemFetchingActions.resultsFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, results: fetchState })
  ),

);
