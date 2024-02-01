import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from 'src/app/groups/models/user';
import { FetchState } from 'src/app/utils/state';

export const userInfoFetchedActions = createActionGroup({
  source: 'User API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<User> }>(),
  },
});

export const userPageActions = createActionGroup({
  source: 'User Page',
  events: {
    refresh: emptyProps(),
  },
});
