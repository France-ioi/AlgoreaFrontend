import { createReducer, on } from '@ngrx/store';
import { initialState, State } from './answer-back-link.state';
import { answerBackLinkActions, sourcePageActions } from './answer-back-link.actions';

const reducer = createReducer(
  initialState,

  on(sourcePageActions.registerAnswerBackLink, (state, { backLink }): State => ({ ...state, backLink })),

  on(answerBackLinkActions.clear, (state): State => ({ ...state, backLink: null })),
);

export default reducer;
