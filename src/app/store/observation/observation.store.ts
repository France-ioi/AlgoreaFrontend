import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './observation.reducer';
import { selectors } from './observation.selectors';
import * as actions from './observation.actions';

export const fromObservation = createFeatureAlt({
  name: 'observation',
  reducer,
  extraSelectors: ({ selectObservationState }) => ({ ...selectors(selectObservationState) }),
  actionGroups: actions
});
