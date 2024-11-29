import { createActionGroup, props } from '@ngrx/store';
import { State } from './selected-content.state';

export const changedContentActions = createActionGroup({
  source: 'Router',
  events: {
    changeItemRoute: props<{ route: State['activity'] }>(),
    changeGroupRouteOrPage: props<{ routeOrPage: State['group'] }>(),
  },
});
