import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './selected-content.reducer';

export const fromSelectedContent = createFeatureAlt({
  name: 'selectedContent',
  reducer,
});
