import { FunctionalEffect } from '@ngrx/effects';
import * as observationEffects from './observation/observation.effects';

export const rootStoreEffects = (): Record<string, FunctionalEffect> => ({
  ...observationEffects,
});

export { fromRouter } from './router/router.store';
export { fromObservation } from './observation/observation.store';

export { RouterSerializer } from './router/router-serializer';

export { ObservationInfo } from './observation/observation.actions';
