import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './item-content.reducer';
import { selectors } from './item-content.selectors';
import * as actions from './item-content.actions';

export const fromItemContent = createFeatureAlt({
  name: 'itemContent',
  reducer,
  extraSelectors: ({ selectItemContentState }) => ({ ...selectors(selectItemContentState) }),
  actionGroups: actions
});
