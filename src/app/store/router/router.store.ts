import { createFeature } from '@ngrx/store';
import { selectors } from './router.selectors';
import { routerReducer } from '@ngrx/router-store';
import { State } from './router.state';

export const fromRouter = createFeature({
  name: 'router',
  reducer: routerReducer<State>,
  extraSelectors: ({ selectRouterState }) => ({ ...selectors(selectRouterState) })
});
