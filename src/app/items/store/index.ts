import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FunctionalEffect } from '@ngrx/effects';
import * as itemRouteEffects from './item-content/item-route.effects';
import * as itemFetchingEffects from './item-content/item-fetching.effects';
import * as itemContentEffects from './item-content/item-content.effects';
import * as answerBackLinkEffects from './answer-back-link/answer-back-link.effects';
import { reducer } from './items.reducer';
import { selectors as itemContentSelectors } from './item-content/item-content.selectors';
import { getAnswerBackLinkSelectors } from './answer-back-link/answer-back-link.selectors';
import * as itemContentActions from './item-content/item-content.actions';
import * as answerBackLinkActions from './answer-back-link/answer-back-link.actions';
import { State as ItemsState, featureName } from './items.state';

export const itemStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...itemRouteEffects,
  ...itemFetchingEffects,
  ...itemContentEffects,
  ...answerBackLinkEffects,
});

const selectItemState = createFeatureSelector<ItemsState>(featureName);

export const fromItemContent = {
  name: featureName,
  reducer,
  ...itemContentSelectors(createSelector(selectItemState, s => s.itemContent)),
  ...getAnswerBackLinkSelectors(createSelector(selectItemState, s => s.answerBackLink)),
  ...itemContentActions,
  ...answerBackLinkActions,
};
