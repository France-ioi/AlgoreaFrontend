import { reducer } from './app-init.reducer';
import { createFeature } from '@ngrx/store';

export const fromAppInit = createFeature({
  name: 'appInit',
  reducer,
});
