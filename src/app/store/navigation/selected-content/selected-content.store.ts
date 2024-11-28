import { reducer } from './selected-content.reducer';
import { createFeature } from '@ngrx/store';

export const fromSelectedContent = createFeature({
  name: 'selectedContent',
  reducer,
});
