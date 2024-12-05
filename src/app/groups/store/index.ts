import { FunctionalEffect } from '@ngrx/effects';
import * as groupFetchingEffects from './group-content/group-fetching.effects';
import * as groupRouteEffects from './group-content/group-route.effects';
import * as groupContentEffects from './group-content/group-content.effects';

export const groupStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...groupFetchingEffects,
  ...groupRouteEffects,
  ...groupContentEffects,
});

export { fromGroupContent } from './group-content/group-content.store';
