import { createFeature } from '@ngrx/store';
import { reducer } from './config.reducer';

export const fromConfig = createFeature({
  name: 'config',
  reducer,
});
