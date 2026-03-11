import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './community.reducer';
import { selectors } from './community.selectors';
import * as actions from './community.actions';

export const fromCommunity = createFeatureAlt({
  name: 'community',
  reducer,
  extraSelectors: ({ selectCommunityState }) => ({ ...selectors(selectCommunityState) }),
  actionGroups: actions,
});
