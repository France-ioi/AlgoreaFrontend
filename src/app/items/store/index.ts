import { createFeatureSelector, createSelector } from '@ngrx/store';
import { reducer } from './items.reducer';
import { selectors as itemContentSelectors } from './item-content/item-content.selectors';
import { getAnswerBackLinkSelectors } from './answer-back-link/answer-back-link.selectors';
import * as itemContentActions from './item-content/item-content.actions';
import * as answerBackLinkActions from './answer-back-link/answer-back-link.actions';
import { State as ItemsState, featureName } from './items.state';

const selectItemState = createFeatureSelector<ItemsState>(featureName);

export const fromItemContent = {
  name: featureName,
  reducer,
  ...itemContentSelectors(createSelector(selectItemState, s => s.itemContent)),
  ...getAnswerBackLinkSelectors(createSelector(selectItemState, s => s.answerBackLink)),
  ...itemContentActions,
  ...answerBackLinkActions,
};
