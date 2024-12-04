import { createReducer, on } from '@ngrx/store';
import { initialState, State } from './current-content.state';
import { contentPageActions } from './current-content.actions';
import { isString } from 'src/app/utils/type-checkers';

export const reducer = createReducer(
  initialState,

  on(
    contentPageActions.changeContent,
    (state, { route, title, breadcrumbs }): State => {
      const sameContent = !isString(route) && !isString(state.route) ? state.route.id === route.id : state.route === route;
      return {
        route,
        title: title ?? (sameContent ? state.title : undefined),
        breadcrumbs: breadcrumbs ?? (sameContent ? state.breadcrumbs : undefined),
      };
    }
  ),

);
