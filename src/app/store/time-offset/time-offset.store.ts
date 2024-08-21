import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './time-offset.reducer';
import { selectors } from './time-offset.selectors';
import * as actions from './time-offset.actions';

export const fromTimeOffset = createFeatureAlt({
  name: 'timeOffset',
  reducer,
  extraSelectors: ({ selectTimeOffsetState }) => ({ ...selectors(selectTimeOffsetState) }),
  actionGroups: actions
});
