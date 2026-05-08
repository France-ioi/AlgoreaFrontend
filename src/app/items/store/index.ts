import { createFeatureSelector, createSelector } from '@ngrx/store';
import { reducer } from './items.reducer';
import { selectors as itemContentSelectors } from './item-content/item-content.selectors';
import { getBackLinkSelectors } from './back-link/back-link.selectors';
import * as itemContentActions from './item-content/item-content.actions';
import * as backLinkActions from './back-link/back-link.actions';
import { State as ItemsState, featureName } from './items.state';

const selectItemState = createFeatureSelector<ItemsState>(featureName);

export const fromItemContent = {
  name: featureName,
  reducer,
  ...itemContentSelectors(createSelector(selectItemState, s => s.itemContent)),
  ...getBackLinkSelectors(createSelector(selectItemState, s => s.backLink)),
  ...itemContentActions,
  ...backLinkActions,
};
