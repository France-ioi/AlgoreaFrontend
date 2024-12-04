import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { GroupInState, State, UserInState } from './group-content.state';

export const groupInfoFetchedActions = createActionGroup({
  source: 'Group-related API',
  events: {
    userFetchStateChanged: props<{ fetchState: UserInState }>(),
    groupFetchStateChanged: props<{ fetchState: GroupInState }>(),
    breadcrumbsFetchStateChanged: props<{ fetchState: State['breadcrumbsState'] }>(),
  },
});

export const routeErrorHandlingActions = createActionGroup({
  source: 'Group route error handling',
  events: {
    routeErrorHandlingChange: props<{ newState: State['routeErrorHandling'] }>(),
  },
});

export const userPageActions = createActionGroup({
  source: 'User Page',
  events: {
    refresh: emptyProps(),
  },
});

export const groupPageActions = createActionGroup({
  source: 'Group Page',
  events: {
    refresh: emptyProps(),
  },
});
