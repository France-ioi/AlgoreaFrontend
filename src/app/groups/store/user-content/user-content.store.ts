import { createFeature } from '@ngrx/store';
import { reducer } from './user-content.reducer';
import { selectors } from './user-content.selectors';
import * as actions from './user-content.actions';

export const fromUserContent = {
  ...createFeature({
    name: 'userContent',
    reducer,
    extraSelectors: ({ selectUserContentState }) => ({ ...selectors(selectUserContentState) })
  }),
  ...actions
};
