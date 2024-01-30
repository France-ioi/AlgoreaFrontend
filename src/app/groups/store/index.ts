import { FunctionalEffect } from '@ngrx/effects';
import * as userContentEffects from './user-content/user-content.effects';

export const groupStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...userContentEffects,
});

export { fromUserContent } from './user-content/user-content.store';
