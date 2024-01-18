import { createFeature } from '@ngrx/store';
import { reducer } from './observation.reducers';
import { selectors } from './observation.selectors';
import * as actions from './observation.actions';

export const fromObservation = {
  ...createFeature({
    name: 'observationFeature',
    reducer,
    extraSelectors: ({ selectGroup }) => ({ ...selectors(selectGroup) })
  }),
  ...actions
};
