import { createFeature } from '@ngrx/store';
import { reducer } from './user-content.reducer';
import * as actions from './user-content.actions';
import * as selectors from './user-content.selectors';

export const fromUserContent = {
  ...createFeature({
    name: 'user-content',
    reducer,
    extraSelectors: () => selectors
  }),
  ...actions
};
