import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { selectors } from './router.selectors';
import { routerReducer } from '@ngrx/router-store';
import { State } from './router.state';

export const fromRouter = createFeatureAlt({
  name: 'router',
  reducer: routerReducer<State>,
  extraSelectors: ({ selectRouterState }) => ({ ...selectors(selectRouterState) })
});
