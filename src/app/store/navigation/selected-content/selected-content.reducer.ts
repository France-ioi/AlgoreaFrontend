import { createReducer, on } from '@ngrx/store';
import { changedContentActions } from './selected-content.actions';
import { initialState, State } from './selected-content.state';
import { isItemRoute } from 'src/app/models/routing/item-route';
import { isSkill } from 'src/app/items/models/item-type';

export const reducer = createReducer(
  initialState,

  on(
    changedContentActions.changeContent,
    (state, { route }): State => ({
      ...state,
      activity: route && isItemRoute(route) && !isSkill(route.contentType) ? route : state.activity,
      skill: route && isItemRoute(route) && isSkill(route.contentType) ? route : state.skill
    })
  ),


);
