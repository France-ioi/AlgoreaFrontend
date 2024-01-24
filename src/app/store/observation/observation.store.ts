import { createFeature } from '@ngrx/store';
import { reducer } from './observation.reducer';
import { selectors } from './observation.selectors';
import * as actions from './observation.actions';

export const fromObservation = {
  ...createFeature({
    name: 'observation',
    reducer,
    extraSelectors: ({ selectGroup }) => ({ ...selectors(selectGroup) })
  }),
  ...actions
};
