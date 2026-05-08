import { FunctionalEffect } from '@ngrx/effects';
import * as itemRouteEffects from './item-content/item-route.effects';
import * as itemFetchingEffects from './item-content/item-fetching.effects';
import * as itemContentEffects from './item-content/item-content.effects';
import * as backLinkEffects from './back-link/back-link.effects';

export const itemStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...itemRouteEffects,
  ...itemFetchingEffects,
  ...itemContentEffects,
  ...backLinkEffects,
});
