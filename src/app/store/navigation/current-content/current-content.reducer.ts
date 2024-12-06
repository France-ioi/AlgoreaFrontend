import { createReducer, on } from '@ngrx/store';
import { initialState, State } from './current-content.state';
import { contentPageActions } from './current-content.actions';
import equal from 'fast-deep-equal/es6';

export const reducer = createReducer(
  initialState,

  on(
    contentPageActions.changeContent,
    (state, { route, title, breadcrumbs }): State => {
      const sameContent = equal(route, state.route);
      return {
        route,
        title: title ?? (sameContent ? state.title : undefined),
        breadcrumbs: breadcrumbs ?? (sameContent ? state.breadcrumbs : undefined),
      };
    }
  ),

);
