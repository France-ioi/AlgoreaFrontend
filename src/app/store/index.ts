import { FunctionalEffect } from '@ngrx/effects';
import * as observationEffects from './observation/observation.effects';

export const rootStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...observationEffects,
});

export { State as RootState } from './root.state';
export { reducer as rootStoreReducer } from './root.state';

export * as routerFeature from './router/router.selectors';
export { fromObservation } from './observation/observation.store';
