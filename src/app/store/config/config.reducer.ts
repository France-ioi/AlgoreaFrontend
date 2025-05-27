import { createReducer, on } from '@ngrx/store';
import { configActions } from './config.actions';
import { initialState, State } from './config.state';

export const reducer = createReducer(
  initialState,

  on(
    configActions.loadConfig,
    (state, { config }): State => ({
      ...state,
      redirects: config.redirects,
    })
  ),

);
