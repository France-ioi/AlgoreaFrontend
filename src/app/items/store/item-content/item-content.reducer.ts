import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './item-content.state';
import { cleanupActions, forumActions, itemRouteErrorHandlingActions } from './item-content.actions';

export const reducer = createReducer(
  initialState,

  on(
    itemRouteErrorHandlingActions.routeErrorHandlingChange,
    (state, { newState }): State => ({ ...state, routeErrorHandling: newState })
  ),

  on(
    forumActions.setAnswer,
    (state, { answer }): State => ({ ...state, answer })
  ),

  on(
    cleanupActions.clearAnswer,
    (state): State => ({ ...state, answer: '' })
  )

);
