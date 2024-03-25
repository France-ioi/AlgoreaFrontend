import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './item-content.state';
import { itemRouteErrorHandlingActions } from './item-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    itemRouteErrorHandlingActions.routeErrorHandlingChange,
    (state, { newState }): State => ({ ...state, routeErrorHandling: newState })
  )

);
