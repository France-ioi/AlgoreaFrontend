import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './group-content.reducer';
import { selectors } from './group-content.selectors';
import * as actions from './group-content.actions';

export const fromGroupContent = createFeatureAlt({
  name: 'groupContent',
  reducer,
  extraSelectors: ({ selectGroupContentState }) => ({ ...selectors(selectGroupContentState) }),
  actionGroups: actions
});
