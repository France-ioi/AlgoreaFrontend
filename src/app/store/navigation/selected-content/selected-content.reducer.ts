import { createReducer, on } from '@ngrx/store';
import { changedContentActions } from './selected-content.actions';
import { configActions } from '../../config';
import { initialState, State } from './selected-content.state';
import { itemTypeCategoryEnum as c } from 'src/app/items/models/item-type';

export const reducer = createReducer(
  initialState,

  on(
    changedContentActions.changeItemRoute,
    (state, { route }): State => ({
      ...state,
      activity: route?.contentType === c.activity ? route : state.activity,
      skill: route?.contentType === c.skill ? route : state.skill,
    })
  ),

  on(
    changedContentActions.changeGroupRouteOrPage,
    (state, { routeOrPage }): State => ({
      ...state,
      group: routeOrPage
    })
  ),

  on(
    configActions.setDefaultRoutes,
    (state, { defaultActivityRoute, defaultSkillRoute }): State => ({
      ...state,
      activity: state.activity === null ? defaultActivityRoute : state.activity,
      skill: state.skill === null ? defaultSkillRoute : state.skill,
    })
  )
);
