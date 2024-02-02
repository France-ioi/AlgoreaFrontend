import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './user-content.reducer';
import { selectors } from './user-content.selectors';
import * as actions from './user-content.actions';

export const fromUserContent = createFeatureAlt({
  name: 'userContent',
  reducer,
  extraSelectors: ({ selectUserContentState }) => ({ ...selectors(selectUserContentState) }),
  actionGroups: actions
});
