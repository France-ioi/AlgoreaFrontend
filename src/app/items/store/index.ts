import { FunctionalEffect } from '@ngrx/effects';
import * as itemRouteEffects from './item-content/item-route.effects';
import * as itemFetchingEffects from './item-content/item-fetching.effects';

export const itemStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...itemRouteEffects,
  ...itemFetchingEffects,
});

export { fromItemContent } from './item-content/item-content.store';
