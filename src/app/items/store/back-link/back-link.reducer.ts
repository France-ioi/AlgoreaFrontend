import { createReducer, on } from '@ngrx/store';
import { initialState, State } from './back-link.state';
import { backLinkActions, sourcePageActions } from './back-link.actions';

const reducer = createReducer(
  initialState,

  on(sourcePageActions.registerBackLink, (state, { backLink }): State => ({ ...state, backLink })),

  on(backLinkActions.clear, (state): State => ({ ...state, backLink: null })),
);

export default reducer;
