import { combineReducers } from '@ngrx/store';
import { reducer as itemContentReducer } from './item-content/item-content.reducer';
import backLinkReducer from './back-link/back-link.reducer';
import { initialState } from './items.state';

export const reducer = combineReducers({
  itemContent: itemContentReducer,
  backLink: backLinkReducer,
}, initialState);
