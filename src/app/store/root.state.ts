import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';

export interface State {
  router: RouterReducerState,
}

export const reducer: ActionReducerMap<State> = {
  router: routerReducer,
};
