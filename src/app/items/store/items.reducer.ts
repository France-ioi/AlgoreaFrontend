import { combineReducers } from '@ngrx/store';
import { reducer as itemContentReducer } from './item-content/item-content.reducer';
import answerBackLinkReducer from './answer-back-link/answer-back-link.reducer';
import { initialState } from './items.state';

export const reducer = combineReducers({
  itemContent: itemContentReducer,
  answerBackLink: answerBackLinkReducer,
}, initialState);
