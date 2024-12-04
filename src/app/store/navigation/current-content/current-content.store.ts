import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './current-content.reducer';
import * as actions from './current-content.actions';
import { selectors } from './current-content.selectors';

export const fromCurrentContent = createFeatureAlt({
  name: 'currentContent',
  reducer,
  extraSelectors: ({ selectCurrentContentState }) => ({ ...selectors(selectCurrentContentState) }),
  actionGroups: actions,
});
