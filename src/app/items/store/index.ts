import { FunctionalEffect } from '@ngrx/effects';
import * as itemRouteEffects from './item-content/item-route.effects';

export const itemStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...itemRouteEffects,
});

export { fromItemContent } from './item-content/item-content.store';
