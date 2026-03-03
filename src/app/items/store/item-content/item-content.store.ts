import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectors } from './item-content.selectors';
import * as actions from './item-content.actions';
import { State } from './item-content.state';
import { featureName } from '../items.state';

/**
 * Internal selectors for the item-content sub-store.
 * Uses the parent feature name and derives the nested itemContent state.
 * For use only within src/app/items/store/ — the public API is src/app/items/store/index.ts.
 */
const selectItemsState = createFeatureSelector<{ itemContent: State }>(featureName);
const selectItemContentState = createSelector(selectItemsState, s => s.itemContent);

export const itemContentStore = {
  ...selectors(selectItemContentState),
  ...actions,
};
