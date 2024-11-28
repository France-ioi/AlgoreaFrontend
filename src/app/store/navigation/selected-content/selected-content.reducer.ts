import { createReducer, on } from '@ngrx/store';
import { changedContentActions } from './selected-content.actions';
import { initialState, State } from './selected-content.state';
import { isSkill } from 'src/app/items/models/item-type';

export const reducer = createReducer(
  initialState,

  on(
    changedContentActions.changeItemRoute,
    (state, { route }): State => ({
      ...state,
      activity: !isSkill(route.contentType) ? route : state.activity,
      skill: isSkill(route.contentType) ? route : state.skill,

    })
  ),

  on(
    changedContentActions.changeGroupRouteOrPage,
    (state, { routeOrPage }): State => ({
      ...state,
      group: routeOrPage
    })
  )


);
