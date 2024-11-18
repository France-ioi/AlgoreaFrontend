import { FunctionalEffect } from '@ngrx/effects';
import * as groupContentEffects from './group-content/group-content.effects';

export const groupStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...groupContentEffects,
});

export { fromGroupContent } from './group-content/group-content.store';
