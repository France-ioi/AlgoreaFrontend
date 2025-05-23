import { createReducer, on } from '@ngrx/store';
import { appInitActions } from './app-init.actions'; // Adjusted path
import { initialState, State } from './app-init.state';

export const reducer = createReducer(
  initialState,

  on(
    appInitActions.loadConfig,
    (state, { config }): State => ({
      ...state,
      redirects: config.redirects,
    })
  ),

);
